import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOwnProfile, changeOwnPassword } from "./actions";
import { ProfileForm } from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  ADMIN: "مدير",
  EDITOR: "محرر",
  VIEWER: "مشاهد",
};

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">بياناتي</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تحديث اسمك وبريدك الإلكتروني وكلمة المرور — الدور: {roleLabel[user?.role ?? session.role] ?? session.role}
        </p>
      </div>
      <ProfileForm
        initial={{ name: user?.name ?? session.name, email: user?.email ?? session.email }}
        profileAction={updateOwnProfile}
        passwordAction={changeOwnPassword}
      />
    </div>
  );
}
