"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export type UserFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  error?: string;
};

const baseSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  role: z.nativeEnum(UserRole),
  isActive: z.string().optional(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "كلمة المرور وتأكيدها غير متطابقين",
    path: ["confirmPassword"],
  });

function toActive(v: string | undefined) {
  return v === "true" || v === "on";
}

async function otherActiveAdminsCount(excludingId: string) {
  return prisma.user.count({
    where: { role: "ADMIN", isActive: true, id: { not: excludingId } },
  });
}

export async function createUser(prevState: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { errors: { confirmPassword: ["كلمة المرور وتأكيدها غير متطابقين"] } };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["يوجد مستخدم بنفس البريد الإلكتروني"] } };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      isActive: toActive(parsed.data.isActive),
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
  });

  redirect("/admin/users");
}

export async function updateUser(
  id: string,
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "المستخدم غير موجود" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const nextRole = parsed.data.role;
  const nextActive = toActive(parsed.data.isActive);

  if (id === session.userId) {
    if (nextRole !== "ADMIN") {
      return { errors: { role: ["لا يمكنك تغيير دورك بنفسك"] } };
    }
    if (!nextActive) {
      return { errors: { isActive: ["لا يمكنك تعطيل حسابك"] } };
    }
  }

  // Last-admin protection: don't demote or disable the only remaining active admin
  if (
    target.role === "ADMIN" &&
    target.isActive &&
    (nextRole !== "ADMIN" || !nextActive) &&
    (await otherActiveAdminsCount(id)) === 0
  ) {
    return { error: "لا يمكن إزالة صلاحيات آخر مدير نشط في النظام" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) {
    return { errors: { email: ["يوجد مستخدم بنفس البريد الإلكتروني"] } };
  }

  await prisma.user.update({
    where: { id },
    data: { name: parsed.data.name, email, role: nextRole, isActive: nextActive },
  });

  redirect("/admin/users");
}

export async function setUserPassword(
  id: string,
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "المستخدم غير موجود" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = passwordSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });

  return { message: "تم تغيير كلمة المرور بنجاح." };
}

export async function setUserActive(
  id: string,
  activate: boolean,
  _prevState: UserFormState,
  _formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "المستخدم غير موجود" };

  if (id === session.userId) {
    return { error: "لا يمكنك تعطيل حسابك" };
  }
  if (target.role === "ADMIN" && target.isActive && !activate && (await otherActiveAdminsCount(id)) === 0) {
    return { error: "لا يمكن تعطيل آخر مدير نشط في النظام" };
  }

  await prisma.user.update({ where: { id }, data: { isActive: activate } });
  return { message: activate ? "تم تفعيل الحساب." : "تم تعطيل الحساب." };
}
