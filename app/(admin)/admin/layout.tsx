import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { logout } from "./actions";
import { LayoutDashboard, FileText, FolderTree, Image as ImageIcon, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminNav = [
  { title: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
  { title: "المحتوى", href: "/admin/content", icon: FileText },
  { title: "الأقسام", href: "/admin/categories", icon: FolderTree },
  { title: "الوسائط", href: "/admin/media", icon: ImageIcon },
  { title: "الإعدادات", href: "/admin/settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
          <Link href="/admin" className="text-lg font-bold">لوحة التحكم</Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{session?.name}</span>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              الموقع
            </Link>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="gap-1 text-destructive">
                <LogOut className="h-4 w-4" /> خروج
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-20 rounded-xl bg-background p-2 ring-1 ring-foreground/10">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 rounded-xl bg-background p-6 ring-1 ring-foreground/10">{children}</main>
      </div>
    </div>
  );
}
