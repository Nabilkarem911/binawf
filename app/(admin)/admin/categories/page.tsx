import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, FolderTree } from "lucide-react";
import { CategoryTree } from "@/components/admin/CategoryTree";

export const dynamic = "force-dynamic";

type CategoryNode = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  isVisible: boolean;
  imageId: string | null;
  imageUrl?: string | null;
  postCount: number;
  childCount: number;
  parentId?: string | null;
  children: CategoryNode[];
};

export default async function CategoriesListPage() {
  await requireAuth();

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      image: { select: { url: true, filename: true } },
      _count: { select: { posts: true, children: true } },
    },
  });

  // Build tree
  const byId = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const cat of categories) {
    byId.set(cat.id, {
      id: cat.id,
      title: cat.title,
      slug: cat.slug,
      sortOrder: cat.sortOrder,
      isVisible: cat.isVisible,
      imageId: cat.imageId,
      imageUrl: cat.image?.url,
      postCount: cat._count.posts,
      childCount: cat._count.children,
      parentId: cat.parentId,
      children: [],
    });
  }

  for (const cat of categories) {
    const node = byId.get(cat.id)!;
    if (cat.parentId && byId.has(cat.parentId)) {
      byId.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Flat list for move dialog
  const flatCategories = categories.map((c) => ({
    id: c.id,
    title: c.title,
    parentId: c.parentId,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">الأقسام</h1>
          <p className="mt-1 text-sm text-muted-foreground">{categories.length} قسم إجمالاً</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          قسم جديد
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <FolderTree className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">لا توجد أقسام بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">ابدأ بإنشاء قسم جديد للموقع</p>
          <Link
            href="/admin/categories/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            إضافة قسم
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-4 shadow-card">
          <CategoryTree nodes={roots} allCategories={flatCategories} />
        </div>
      )}
    </div>
  );
}
