"use server";

import { revalidatePublic } from "@/lib/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const navigationSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  url: z.string().min(1, "الرابط مطلوب"),
  target: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isVisible: z.coerce.boolean().default(true),
  location: z.enum(["HEADER", "FOOTER"] as const, {
    message: "الموقع يجب أن يكون HEADER أو FOOTER",
  }).default("HEADER"),
});

export type NavigationFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function normalizeParentId(id: string | null | undefined) {
  if (!id || id === "__none__") return null;
  return id;
}

function normalizeTarget(target: string | null | undefined) {
  if (!target || target === "__none__") return null;
  return target;
}

export async function createNavigationItem(
  prevState: NavigationFormState,
  formData: FormData
): Promise<NavigationFormState> {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = navigationSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const parentId = normalizeParentId(data.parentId);
  const target = normalizeTarget(data.target);

  await prisma.navigationItem.create({
    data: {
      title: data.title,
      url: data.url,
      target,
      icon: data.icon || null,
      parentId,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
      location: data.location,
    },
  });

  revalidatePublic();
  redirect("/admin/navigation");
}

export async function updateNavigationItem(
  id: string,
  prevState: NavigationFormState,
  formData: FormData
): Promise<NavigationFormState> {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = navigationSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const parentId = normalizeParentId(data.parentId);
  const target = normalizeTarget(data.target);

  const current = await prisma.navigationItem.findUnique({ where: { id } });
  if (!current) return { message: "عنصر القائمة غير موجود" };

  await prisma.navigationItem.update({
    where: { id },
    data: {
      title: data.title,
      url: data.url,
      target,
      icon: data.icon || null,
      parentId,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
      location: data.location,
    },
  });

  revalidatePublic();
  redirect("/admin/navigation");
}

export async function deleteNavigationItem(id: string) {
  await requireAuth();
  await prisma.navigationItem.delete({ where: { id } });
  revalidatePublic();
  redirect("/admin/navigation");
}

export async function toggleNavigationVisibility(id: string): Promise<boolean> {
  await requireAuth();
  const current = await prisma.navigationItem.findUnique({ where: { id } });
  if (!current) throw new Error("عنصر القائمة غير موجود");

  const isVisible = !current.isVisible;
  await prisma.navigationItem.update({
    where: { id },
    data: { isVisible },
  });

  revalidatePublic();
  return isVisible;
}

export async function reorderNavigationItems(
  items: { id: string; sortOrder: number; parentId: string | null }[]
) {
  await requireAuth();
  await prisma.$transaction(
    items.map((item) =>
      prisma.navigationItem.update({
        where: { id: item.id },
        data: {
          sortOrder: item.sortOrder,
          parentId: item.parentId,
        },
      })
    )
  );

  revalidatePublic();
}
