"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const settingSchema = z.object({
  site_title: z.string().min(1),
  site_subtitle: z.string().optional(),
  site_description: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  footer_text: z.string().optional(),
});

export type SettingsFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function updateSettings(
  prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = settingSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: "site_title" },
      create: { key: "site_title", value: data.site_title, label: "عنوان الموقع" },
      update: { value: data.site_title },
    }),
    prisma.siteSetting.upsert({
      where: { key: "site_subtitle" },
      create: { key: "site_subtitle", value: data.site_subtitle || "", label: "العنوان الفرعي" },
      update: { value: data.site_subtitle || "" },
    }),
    prisma.siteSetting.upsert({
      where: { key: "site_description" },
      create: { key: "site_description", value: data.site_description || "", label: "وصف الموقع" },
      update: { value: data.site_description || "" },
    }),
    prisma.siteSetting.upsert({
      where: { key: "contact_email" },
      create: { key: "contact_email", value: data.contact_email || "", label: "البريد الإلكتروني" },
      update: { value: data.contact_email || "" },
    }),
    prisma.siteSetting.upsert({
      where: { key: "footer_text" },
      create: { key: "footer_text", value: data.footer_text || "", label: "نص تذييل الموقع" },
      update: { value: data.footer_text || "" },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/[...slug]");
  return { message: "تم حفظ الإعدادات بنجاح." };
}
