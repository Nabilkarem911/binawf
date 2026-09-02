import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSettings } from "./actions";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAuth();
  const settings = await prisma.siteSetting.findMany();
  const values = new Map(settings.map((s) => [s.key, s.value]));

  const initial = {
    site_title: values.get("site_title") || "",
    site_subtitle: values.get("site_subtitle") || "",
    site_description: values.get("site_description") || "",
    contact_email: values.get("contact_email") || "",
    footer_text: values.get("footer_text") || "",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إعدادات الموقع</h1>
      <SettingsForm initial={initial} action={updateSettings} />
    </div>
  );
}
