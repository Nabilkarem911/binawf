"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, createSessionCookie } from "@/lib/auth";
import { sessionOptions } from "@/lib/session";

export type ProfileFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const profileSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة للتأكيد"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(8, "كلمة المرور الجديدة 8 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
    path: ["confirmPassword"],
  });

export async function updateOwnProfile(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const session = await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { errors: { currentPassword: ["الحساب غير موجود"] } };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { errors: { currentPassword: ["كلمة المرور الحالية غير صحيحة"] } };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.userId) {
    return { errors: { email: ["يوجد مستخدم بنفس البريد الإلكتروني"] } };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { name: parsed.data.name, email },
  });

  // Refresh the session cookie so the sidebar/layout shows the new name & email immediately.
  const sealed = await createSessionCookie({
    userId: session.userId,
    email,
    name: parsed.data.name,
    role: session.role,
    isLoggedIn: true,
  });
  (await cookies()).set(sessionOptions.cookieName, sealed, sessionOptions.cookieOptions);

  return { message: "تم حفظ بياناتك بنجاح." };
}

export async function changeOwnPassword(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const session = await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = passwordSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { errors: { currentPassword: ["الحساب غير موجود"] } };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { errors: { currentPassword: ["كلمة المرور الحالية غير صحيحة"] } };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });

  return { message: "تم تغيير كلمة المرور بنجاح." };
}
