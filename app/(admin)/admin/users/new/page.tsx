import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";
import { createUser } from "../actions";
import { UserForm } from "@/components/admin/UserForm";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة للمستخدمين
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">مستخدم جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">أضف حساباً جديداً للوحة التحكم</p>
      </div>
      <UserForm
        mode="create"
        action={createUser}
        initial={{ name: "", email: "", role: "EDITOR", isActive: true }}
      />
    </div>
  );
}
