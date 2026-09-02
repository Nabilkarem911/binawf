import { getAdminSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // Don't render sidebar for unauthenticated pages (login page)
  if (!session) {
    return <main className="min-h-screen">{children}</main>;
  }

  const roleLabel: Record<string, string> = {
    ADMIN: "مدير",
    EDITOR: "محرر",
    VIEWER: "مشاهد",
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar
        userName={session.name}
        userRole={roleLabel[session.role] ?? "محرر"}
      />
      <main className="flex-1 overflow-x-hidden">
        <div className="container-page py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
