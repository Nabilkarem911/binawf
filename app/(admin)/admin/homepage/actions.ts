"use server";

import { revalidatePublic } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const toggleSchema = z.object({
  id: z.string().min(1),
  isVisible: z.string(),
});

export async function toggleHomepageSection(_: unknown, formData: FormData) {
  await requireAuth();
  const parsed = toggleSchema.safeParse({
    id: formData.get("id"),
    isVisible: formData.get("isVisible"),
  });
  if (!parsed.success) return { error: "بيانات غير صالحة" };

  await prisma.homepageSection.update({
    where: { id: parsed.data.id },
    data: { isVisible: parsed.data.isVisible === "true" },
  });

  revalidatePublic();
  return { ok: true };
}

export async function reorderHomepageSections(_: unknown, formData: FormData) {
  await requireAuth();
  const idsRaw = formData.get("ids");
  if (typeof idsRaw !== "string") return { error: "بيانات غير صالحة" };
  const ids = idsRaw.split(",").filter(Boolean);
  if (ids.length === 0) return { error: "لا توجد أقسام" };

  for (let i = 0; i < ids.length; i++) {
    await prisma.homepageSection.update({
      where: { id: ids[i] },
      data: { sortOrder: (i + 1) * 10 },
    });
  }

  revalidatePublic();
  return { ok: true };
}

export async function updateHomepageSectionTitle(_: unknown, formData: FormData) {
  await requireAuth();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const subtitle = formData.get("subtitle") as string;

  if (!id || !title) return { error: "بيانات ناقصة" };

  await prisma.homepageSection.update({
    where: { id },
    data: { title, subtitle: subtitle || null },
  });

  revalidatePublic();
  return { ok: true };
}
