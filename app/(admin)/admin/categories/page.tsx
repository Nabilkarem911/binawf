import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, FolderTree, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

type CategoryNode = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  showInMenu: boolean;
  image: { url: string } | null;
  _count: { posts: number };
  children: CategoryNode[];
};

export default async function CategoriesListPage() {
  await requireAuth();

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      parent: { select: { title: true } },
      image: { select: { url: true } },
      _count: { select: { posts: true } },
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
      description: cat.description,
      sortOrder: cat.sortOrder,
      isVisible: cat.isVisible,
      showInMenu: cat.showInMenu,
      image: cat.image,
      _count: cat._count,
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

  function renderTree(nodes: CategoryNode[], depth: number = 0): React.ReactElement {
    return (
      <>
        {nodes.map((node) => (
          <div key={node.id}>
            <Link
              href={`/admin/categories/${node.id}`}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-all hover:shadow-card-hover hover:border-border"
              style={{ marginRight: depth > 0 ? `${depth * 24}px` : undefined }}
            >
              {node.image ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <Image src={node.image.url} alt={node.title} fill className="object-cover" sizes="40px" unoptimized />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FolderTree className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground group-hover:text-primary line-clamp-1">{node.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span dir="ltr">{node.slug}</span>
                  <span>•</span>
                  <span>{node._count.posts} محتوى</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {node.isVisible ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <Eye className="h-3 w-3" /> مرئي
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    <EyeOff className="h-3 w-3" /> مخفي
                  </span>
                )}
              </div>
            </Link>
            {node.children.length > 0 && (
              <div className="mt-1.5 space-y-1.5">
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        ))}
      </>
    );
  }

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
        <div className="space-y-1.5">
          {renderTree(roots)}
        </div>
      )}
    </div>
  );
}
