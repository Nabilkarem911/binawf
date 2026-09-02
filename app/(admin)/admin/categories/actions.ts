"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PostType } from "@prisma/client";

const categorySchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  slug: z.string().min(1, "المعرف مطلوب").regex(/^[\w\u0621-\u064A\u0660-\u0669-]+$/, "المعرف يحتوي على أحرف غير صالحة"),
  description: z.string().optional().nullable(),
  contentType: z.nativeEnum(PostType).optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isVisible: z.coerce.boolean().default(true),
  showInMenu: z.coerce.boolean().default(true),
});

export type CategoryFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function normalizeParentId(id: string | null | undefined) {
  if (!id || id === "__none__") return null;
  return id;
}

export async function createCategory(
  prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = categorySchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const parentId = normalizeParentId(data.parentId);

  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { errors: { slug: ["يوجد قسم بنفس المعرف"] } };
  }

  await prisma.category.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      contentType: data.contentType || PostType.ARTICLE,
      parentId,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
      showInMenu: data.showInMenu,
    },
  });

  revalidatePath("/");
  revalidatePath("/[...slug]");
  redirect("/admin/categories");
}

export async function updateCategory(
  id: string,
  prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = categorySchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const parentId = normalizeParentId(data.parentId);

  await prisma.category.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      contentType: data.contentType || PostType.ARTICLE,
      parentId,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
      showInMenu: data.showInMenu,
    },
  });

  revalidatePath("/");
  revalidatePath("/[...slug]");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAuth();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/[...slug]");
}
