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
  imageId: z.string().optional().nullable(),
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
      imageId: data.imageId || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/[...slug]", "page");
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

  // Cycle prevention: if setting a parent, ensure it's not a descendant
  if (parentId && parentId === id) {
    return { errors: { parentId: ["لا يمكن أن يكون القسم أبًا لنفسه"] } };
  }
  if (parentId) {
    const descendants = await collectDescendants(id);
    if (descendants.has(parentId)) {
      return { errors: { parentId: ["لا يمكن اختيار فرع كأب — سيؤدي إلى دورة"] } };
    }
  }

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
      imageId: data.imageId || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/[...slug]", "page");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAuth();
  // Check for children
  const children = await prisma.category.count({ where: { parentId: id } });
  if (children > 0) {
    // Re-parent children to grandparent (or root)
    const category = await prisma.category.findUnique({ where: { id } });
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: category?.parentId ?? null },
    });
  }
  // Soft delete: set isVisible=false and deletedAt
  await prisma.category.update({
    where: { id },
    data: { isVisible: false, deletedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/[...slug]", "page");
  redirect("/admin/categories");
}

export async function toggleCategoryVisibility(id: string): Promise<{ isVisible: boolean } | { error: string }> {
  await requireAuth();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return { error: "القسم غير موجود" };
  const updated = await prisma.category.update({
    where: { id },
    data: { isVisible: !category.isVisible },
  });
  revalidatePath("/");
  revalidatePath("/[...slug]", "page");
  return { isVisible: updated.isVisible };
}

export async function reorderCategories(items: { id: string; sortOrder: number; parentId: string | null }[]) {
  await requireAuth();
  await prisma.$transaction(
    items.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, parentId: item.parentId },
      })
    )
  );
  revalidatePath("/");
  revalidatePath("/[...slug]", "page");
  return { ok: true };
}

export async function moveCategory(id: string, newParentId: string | null): Promise<{ ok: boolean } | { error: string }> {
  await requireAuth();
  if (newParentId === id) return { error: "لا يمكن أن يكون القسم أبًا لنفسه" };

  // Cycle prevention: check if newParentId is a descendant of id
  if (newParentId) {
    const descendants = await collectDescendants(id);
    if (descendants.has(newParentId)) {
      return { error: "لا يمكن نقل قسم إلى أحد فروعه" };
    }
  }

  await prisma.category.update({
    where: { id },
    data: { parentId: newParentId },
  });
  revalidatePath("/");
  revalidatePath("/[...slug]", "page");
  return { ok: true };
}

async function collectDescendants(id: string): Promise<Set<string>> {
  const descendants = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = await prisma.category.findMany({
      where: { parentId: current },
      select: { id: true },
    });
    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return descendants;
}
