import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { updateUser, setUserPassword, setUserActive } from "../actions";
import { UserForm } from "@/components/admin/UserForm";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة للمستخدمين
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">تعديل: {user.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{user.email}</p>
      </div>
      <UserForm
        mode="edit"
        isSelf={user.id === session.userId}
        initial={{ name: user.name, email: user.email, role: user.role, isActive: user.isActive }}
        action={updateUser.bind(null, user.id)}
        passwordAction={setUserPassword.bind(null, user.id)}
        toggleAction={user.id === session.userId ? undefined : setUserActive.bind(null, user.id, !user.isActive)}
      />
    </div>
  );
}
