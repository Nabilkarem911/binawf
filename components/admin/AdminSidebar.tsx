"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X, Menu, Palette, ExternalLink, LogOut,
  LayoutDashboard, FileText, FolderTree, Image as ImageIcon,
  Settings, Layers, Navigation as NavIcon, Users,
} from "lucide-react";
import { logout } from "@/app/(admin)/admin/actions";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "الرئيسية",
    items: [
      { title: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { title: "كل المحتوى", href: "/admin/content", icon: FileText },
      { title: "الأقسام", href: "/admin/categories", icon: FolderTree },
    ],
  },
  {
    label: "التخصيص",
    items: [
      { title: "الوسائط", href: "/admin/media", icon: ImageIcon },
      { title: "الصفحة الرئيسية", href: "/admin/homepage", icon: Layers },
      { title: "القوائم", href: "/admin/navigation", icon: NavIcon },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { title: "المستخدمون", href: "/admin/users", icon: Users },
      { title: "الإعدادات", href: "/admin/settings", icon: Settings },
    ],
  },
];

function SidebarContent({
  userName,
  userRole,
  onNavigate,
}: {
  userName: string;
  userRole: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent text-gold">
          <Palette className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-sidebar-foreground">موهبة فنان</p>
          <p className="text-[11px] text-sidebar-foreground/50">لوحة التحكم</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-bold text-sidebar-foreground/60">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">{userRole}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-1">
          <Link
            href="/"
            target="_blank"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            عرض الموقع
          </Link>
          <form action={logout} className="flex-1">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-sidebar-accent"
            >
              <LogOut className="h-3.5 w-3.5" />
              خروج
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen overflow-hidden bg-sidebar">
          <SidebarContent userName={userName} userRole={userRole} />
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-sidebar shadow-navy animate-in slide-in-from-right duration-300">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute left-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent"
              aria-label="إغلاق القائمة"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent userName={userName} userRole={userRole} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
