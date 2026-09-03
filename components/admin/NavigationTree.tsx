"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GripVertical, Pencil, Navigation as NavIcon } from "lucide-react";
import { DeleteConfirmButton } from "@/components/admin/DeleteConfirmButton";
import { deleteNavigationItem, toggleNavigationVisibility } from "@/app/(admin)/admin/navigation/actions";

type NavItem = {
  id: string;
  title: string;
  url: string;
  isVisible: boolean;
  sortOrder: number;
  children: NavItem[];
};

export function NavigationTree({ items }: { items: NavItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <NavIcon className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-medium text-foreground">لا توجد عناصر قائمة</p>
        <p className="mt-1 text-sm text-muted-foreground">ابدأ بإضافة عنصر قائمة جديد</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <NavItemRow key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
}

function NavItemRow({ item, depth }: { item: NavItem; depth: number }) {
  const [isToggling, startToggle] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startToggle(async () => {
      await toggleNavigationVisibility(item.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card" style={{ marginRight: depth > 0 ? 0 : undefined }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground/40" />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <NavIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{item.title}</p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">{item.url}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-colors ${
              item.isVisible
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={item.isVisible ? "إخفاء" : "إظهار"}
          >
            {item.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {item.isVisible ? "ظاهر" : "مخفي"}
          </button>
          <Link
            href={`/admin/navigation/${item.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-secondary px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80"
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل
          </Link>
          <DeleteConfirmButton
            action={deleteNavigationItem.bind(null, item.id)}
            label=""
            title="تأكيد حذف عنصر القائمة"
            message={`هل أنت متأكد من حذف "${item.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          />
        </div>
      </div>
      {item.children.length > 0 && (
        <div className="mt-3 space-y-1.5 border-r-2 border-border/40 pr-4">
          {item.children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => (
              <div key={child.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/40" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{child.title}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">{child.url}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isToggling}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      child.isVisible ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={child.isVisible ? "إخفاء" : "إظهار"}
                  >
                    {child.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <Link
                    href={`/admin/navigation/${child.id}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-secondary/80"
                  >
                    <Pencil className="h-3 w-3" />
                  </Link>
                  <DeleteConfirmButton
                    action={deleteNavigationItem.bind(null, child.id)}
                    label=""
                    title="تأكيد حذف عنصر القائمة"
                    message={`هل أنت متأكد من حذف "${child.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
