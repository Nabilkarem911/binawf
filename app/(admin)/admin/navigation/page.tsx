import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Navigation as NavIcon, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NavigationPage() {
  await requireAuth();
  const navItems = await prisma.navigationItem.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">القوائم</h1>
          <p className="mt-1 text-sm text-muted-foreground">إدارة عناصر القائمة في الترويسة والتذييل</p>
        </div>
        <Link
          href="/admin/navigation/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          عنصر جديد
        </Link>
      </div>

      <div className="space-y-2">
        {navItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <NavIcon className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-foreground">لا توجد عناصر قائمة</p>
            <p className="mt-1 text-sm text-muted-foreground">ابدأ بإضافة عنصر قائمة جديد</p>
          </div>
        ) : (
          navItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <NavIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{item.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.isVisible ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      <Eye className="h-3 w-3" /> ظاهر
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                      <EyeOff className="h-3 w-3" /> مخفي
                    </span>
                  )}
                </div>
              </div>
              {item.children.length > 0 && (
                <div className="mt-3 space-y-1.5 border-r-2 border-border/40 pr-4">
                  {item.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{child.title}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{child.url}</p>
                      </div>
                      {child.isVisible ? (
                        <Eye className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
