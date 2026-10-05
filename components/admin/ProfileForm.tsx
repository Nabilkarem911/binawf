"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, UserCog, KeyRound } from "lucide-react";
import type { ProfileFormState } from "@/app/(admin)/admin/profile/actions";

type ActionFn = (prevState: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;

function FormFeedback({ state }: { state: ProfileFormState }) {
  const errors = Object.values(state.errors ?? {}).flat();
  return (
    <>
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>{errors.join(" ")}</AlertDescription>
        </Alert>
      )}
      {state.message && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {state.message}
        </div>
      )}
    </>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="h-10 px-6" disabled={pending}>
      <Save className="h-4 w-4" />
      {pending ? "جاري الحفظ..." : children}
    </Button>
  );
}

export function ProfileForm({
  initial,
  profileAction,
  passwordAction,
}: {
  initial: { name: string; email: string };
  profileAction: ActionFn;
  passwordAction: ActionFn;
}) {
  const [profileState, profileFormAction] = useActionState(profileAction, {});
  const [passwordState, passwordFormAction] = useActionState(passwordAction, {});

  return (
    <div className="space-y-6">
      {/* Name & email — requires current password confirmation */}
      <form action={profileFormAction} className="space-y-6">
        <FormFeedback state={profileState} />
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-foreground">
            <UserCog className="h-5 w-5 text-accent" />
            بيانات الحساب
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" name="name" defaultValue={initial.name} required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initial.email}
                required
                dir="ltr"
                className="h-10 text-left"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile_currentPassword">كلمة المرور الحالية للتأكيد</Label>
              <Input
                id="profile_currentPassword"
                name="currentPassword"
                type="password"
                required
                dir="ltr"
                className="h-10 text-left"
                autoComplete="current-password"
              />
              <p className="text-xs text-muted-foreground">مطلوبة لحفظ أي تغيير في بياناتك</p>
            </div>
          </div>
        </section>
        <SubmitButton>حفظ البيانات</SubmitButton>
      </form>

      {/* Password change */}
      <form action={passwordFormAction} className="space-y-6">
        <FormFeedback state={passwordState} />
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-foreground">
            <KeyRound className="h-5 w-5 text-accent" />
            تغيير كلمة المرور
          </h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pw_currentPassword">كلمة المرور الحالية</Label>
              <Input
                id="pw_currentPassword"
                name="currentPassword"
                type="password"
                required
                dir="ltr"
                className="h-10 text-left"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw_newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="pw_newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                dir="ltr"
                className="h-10 text-left"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw_confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="pw_confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                dir="ltr"
                className="h-10 text-left"
                autoComplete="new-password"
              />
            </div>
          </div>
        </section>
        <SubmitButton>تغيير كلمة المرور</SubmitButton>
      </form>
    </div>
  );
}
