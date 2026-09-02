"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
            {Object.values(state.errors)
              .flat()
              .join(" ")}
          </AlertDescription>
        </Alert>
      )}
      {state?.message && <p className="text-sm text-green-600">{state.message}</p>}

      <div className="space-y-2">
        <Label htmlFor="site_title">عنوان الموقع</Label>
        <Input id="site_title" name="site_title" defaultValue={initial.site_title} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="site_subtitle">العنوان الفرعي</Label>
        <Input id="site_subtitle" name="site_subtitle" defaultValue={initial.site_subtitle} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="site_description">وصف الموقع</Label>
        <Textarea id="site_description" name="site_description" defaultValue={initial.site_description} rows={4} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_email">البريد الإلكتروني</Label>
        <Input id="contact_email" name="contact_email" type="email" defaultValue={initial.contact_email} dir="ltr" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="footer_text">نص تذييل الموقع</Label>
        <Input id="footer_text" name="footer_text" defaultValue={initial.footer_text} />
      </div>

      <Button type="submit">حفظ الإعدادات</Button>
    </form>
  );
}
