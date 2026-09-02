import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Shield, Check, X } from "lucide-react";

export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  ADMIN: "مدير",
  EDITOR: "محرر",
  VIEWER: "مشاهد",
};

const roleColor: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  EDITOR: "bg-blue-100 text-blue-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

export default async function UsersPage() {
  const session = await requireAuth();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">المستخدمون</h1>
          <p className="mt-1 text-sm text-muted-foreground">{users.length} مستخدم — إدارة الحسابات والصلاحيات</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          disabled
          title="قريباً"
        >
          <Plus className="h-4 w-4" />
          مستخدم جديد
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-right">
                <th className="px-4 py-3 font-semibold text-muted-foreground">الاسم</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">البريد</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">الدور</th>
                <th className="hidden px-4 py-3 font-semibold text-muted-foreground sm:table-cell">الحالة</th>
                <th className="hidden px-4 py-3 font-semibold text-muted-foreground md:table-cell">آخر دخول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{user.name}</p>
                        {user.id === session.userId && (
                          <span className="text-xs text-accent">أنت</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor[user.role]}`}>
                      <Shield className="h-3 w-3" />
                      {roleLabel[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <Check className="h-3.5 w-3.5" /> نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                        <X className="h-3.5 w-3.5" /> معطّل
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {user.lastLoginAt
                      ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "short", timeStyle: "short" }).format(user.lastLoginAt)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
