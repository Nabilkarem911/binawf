"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Globe, Mail, FileText } from "lucide-react";
import type { SettingsFormState } from "@/app/(admin)/admin/settings/actions";

export function SettingsForm({
  initial,
  action,
}: {
  initial: {
    site_title: string;
    site_subtitle: string;
    site_description: string;
    contact_email: string;
    footer_text: string;
  };
  action: (prevState: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
}) {
  const [state, formAction] = useActionState(action, { message: "" });

  return (
    <form action={formAction} className="space-y-6">
      {state?.errors && Object.values(state.errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {Object.values(state.errors).flat().join(" ")}
          </AlertDescription>
        </Alert>
      )}
      {state?.message && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {state.message}
        </div>
      )}

      {/* Site identity */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-foreground">
          <Globe className="h-5 w-5 text-accent" />
          هوية الموقع
        </h3>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="site_title">عنوان الموقع</Label>
            <Input id="site_title" name="site_title" defaultValue={initial.site_title} required className="h-10" />
            <p className="text-xs text-muted-foreground">يظهر في الترويسة والمتصفح</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_subtitle">العنوان الفرعي</Label>
            <Input id="site_subtitle" name="site_subtitle" defaultValue={initial.site_subtitle} className="h-10" />
            <p className="text-xs text-muted-foreground">يظهر تحت العنوان في الترويسة</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_description">وصف الموقع</Label>
            <Textarea id="site_description" name="site_description" defaultValue={initial.site_description} rows={3} />
            <p className="text-xs text-muted-foreground">يستخدم في وصف SEO والوسوم</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-foreground">
          <Mail className="h-5 w-5 text-accent" />
          معلومات التواصل
        </h3>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="contact_email">البريد الإلكتروني</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={initial.contact_email} dir="ltr" className="h-10" />
            <p className="text-xs text-muted-foreground">يظهر في تذييل الموقع</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-foreground">
          <FileText className="h-5 w-5 text-accent" />
          التذييل
        </h3>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="footer_text">نص تذييل الموقع</Label>
            <Input id="footer_text" name="footer_text" defaultValue={initial.footer_text} className="h-10" />
            <p className="text-xs text-muted-foreground">يظهر في أسفل كل صفحة</p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" className="h-11 px-6">
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </Button>
      </div>
    </form>
  );
}
