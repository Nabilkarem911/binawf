"use server";

import { revalidatePublic } from "@/lib/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PostStatus, PostType } from "@prisma/client";
import { sanitizeHtml } from "@/lib/sanitize";

const postSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  slug: z.string().min(1, "المعرف مطلوب").regex(/^[\w\u0621-\u064A\u0660-\u0669-]+$/, "المعرف يحتوي على أحرف غير صالحة"),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  type: z.nativeEnum(PostType),
  status: z.nativeEnum(PostStatus),
  categoryId: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  featuredImageId: z.string().optional().nullable(),
  featuredImageAlt: z.string().optional().nullable(),
});

export type PostFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function normalizeCategoryId(id: string | null | undefined) {
  if (!id || id === "__none__") return null;
  return id;
}

export async function createPost(prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const session = await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const normalizedCategoryId = normalizeCategoryId(data.categoryId);
  const normalizedImageId = data.featuredImageId || null;

  const existing = await prisma.post.findFirst({
    where: { slug: data.slug, categoryId: normalizedCategoryId },
  });
  if (existing) {
    return { errors: { slug: ["يوجد محتوى بنفس المعرف في هذا القسم"] } };
  }

  await prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content ? sanitizeHtml(data.content) : null,
      type: data.type,
      status: data.status,
      categoryId: normalizedCategoryId,
      authorId: session.userId,
      publishedAt: data.status === PostStatus.PUBLISHED ? new Date() : null,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords,
      isFeatured: data.isFeatured,
      featuredImageId: normalizedImageId,
    },
  });

  revalidatePublic();
  redirect("/admin/content");
}

export async function updatePost(
  id: string,
  prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const normalizedCategoryId = normalizeCategoryId(data.categoryId);
  const normalizedImageId = data.featuredImageId || null;
  const current = await prisma.post.findUnique({ where: { id } });
  if (!current) return { message: "المحتوى غير موجود" };

  await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content ? sanitizeHtml(data.content) : null,
      type: data.type,
      status: data.status,
      categoryId: normalizedCategoryId,
      publishedAt:
        data.status === PostStatus.PUBLISHED && !current.publishedAt ? new Date() : current.publishedAt,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords,
      isFeatured: data.isFeatured,
      featuredImageId: normalizedImageId,
    },
  });

  revalidatePublic();
  redirect("/admin/content");
}

export async function deletePost(id: string) {
  await requireAuth();
  await prisma.post.delete({ where: { id } });
  revalidatePublic();
  redirect("/admin/content");
}
