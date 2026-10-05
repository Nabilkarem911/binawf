"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Shield, KeyRound, UserCheck, UserX } from "lucide-react";
import type { UserFormState } from "@/app/(admin)/admin/users/actions";

const roleOptions = [
  { value: "ADMIN", label: "مدير" },
  { value: "EDITOR", label: "محرر" },
  { value: "VIEWER", label: "مشاهد" },
];

type ActionFn = (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;

function FieldErrors({ state }: { state: UserFormState }) {
  const errors = Object.values(state.errors ?? {}).flat();
  if (!errors.length) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{errors.join(" ")}</AlertDescription>
    </Alert>
  );
}

function StatusMessages({ state }: { state: UserFormState }) {
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }
  if (state.message) {
    return (
      <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        {state.message}
      </div>
    );
  }
  return null;
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

function ToggleSubmitButton({ activate }: { activate: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={activate ? "outline" : "destructive"}
      className="h-10 px-5"
      disabled={pending}
    >
      {activate ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
      {pending ? "جاري التنفيذ..." : activate ? "تفعيل الحساب" : "تعطيل الحساب"}
    </Button>
  );
}

export function UserForm({
  mode,
  initial,
  action,
  isSelf = false,
  passwordAction,
  toggleAction,
}: {
  mode: "create" | "edit";
  initial: { name: string; email: string; role: string; isActive: boolean };
  action: ActionFn;
  isSelf?: boolean;
  passwordAction?: ActionFn;
  toggleAction?: ActionFn;
}) {
  const [state, formAction] = useActionState(action, {});
  const [passwordState, passwordFormAction] = useActionState(
    passwordAction ?? (async () => ({})),
    {}
  );
  const [toggleState, toggleFormAction] = useActionState(
    toggleAction ?? (async () => ({})),
    {}
  );
  const [role, setRole] = useState(initial.role);
  const [isActive, setIsActive] = useState(initial.isActive);

  return (
    <div className="space-y-6">
      {/* Main info form */}
      <form action={formAction} className="space-y-6">
        <FieldErrors state={state} />
        <StatusMessages state={state} />
        <input type="hidden" name="role" value={isSelf ? "ADMIN" : role} />
        <input type="hidden" name="isActive" value={isSelf ? "true" : String(isActive)} />

        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-foreground">
            <Shield className="h-5 w-5 text-accent" />
            بيانات المستخدم
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
            <div className="space-y-2">
              <Label>الدور</Label>
              {isSelf ? (
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                  {roleOptions.find((r) => r.value === initial.role)?.label ?? initial.role}
                </div>
              ) : (
                <Select value={role} onValueChange={(v) => v && setRole(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              {isSelf ? (
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                  نشط — لا يمكن تعطيل حسابك
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex h-10 w-full items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  {isActive ? "نشط" : "معطّل"}
                </button>
              )}
            </div>

            {mode === "create" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    dir="ltr"
                    className="h-10 text-left"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    dir="ltr"
                    className="h-10 text-left"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <SubmitButton>{mode === "create" ? "إنشاء المستخدم" : "حفظ التعديلات"}</SubmitButton>
        </div>
      </form>

      {mode === "edit" && passwordAction && (
        <form action={passwordFormAction} className="space-y-6">
          <FieldErrors state={passwordState} />
          <StatusMessages state={passwordState} />
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-foreground">
              <KeyRound className="h-5 w-5 text-accent" />
              تغيير كلمة المرور
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new_password">كلمة المرور الجديدة</Label>
                <Input
                  id="new_password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  dir="ltr"
                  className="h-10 text-left"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="new_confirmPassword"
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
      )}

      {mode === "edit" && toggleAction && (
        <form action={toggleFormAction} className="space-y-4">
          <StatusMessages state={toggleState} />
          <section className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isActive
                    ? "الحساب المعطّل لا يستطيع تسجيل الدخول وتنتهي جلسته فوراً — بلا حذف لبياناته."
                    : "يستعيد المستخدم إمكانية تسجيل الدخول فوراً."}
                </p>
              </div>
              <ToggleSubmitButton activate={!isActive} />
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
