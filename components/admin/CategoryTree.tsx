"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Eye, EyeOff, Plus, Folder, FolderOpen, ChevronDown, ChevronLeft } from "lucide-react";
import { toggleCategoryVisibility, moveCategory } from "@/app/(admin)/admin/categories/actions";

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

function getMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.startsWith("/uploads/") ? `/api/media?filename=${url.split("/").pop()}` : url;
}

export function CategoryTree({ nodes, allCategories }: { nodes: CategoryNode[]; allCategories: { id: string; title: string; parentId: string | null }[] }) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <CategoryTreeNode
          key={node.id}
          node={node}
          depth={0}
          allCategories={allCategories}
        />
      ))}
    </div>
  );
}

function CategoryTreeNode({
  node,
  depth,
  allCategories,
}: {
  node: CategoryNode;
  depth: number;
  allCategories: { id: string; title: string; parentId: string | null }[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [isToggling, startToggleTransition] = useTransition();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string>("__none__");
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isMoving, startMoveTransition] = useTransition();
  const router = useRouter();

  const hasChildren = node.children.length > 0;

  function handleToggle() {
    startToggleTransition(async () => {
      const result = await toggleCategoryVisibility(node.id);
      if ("isVisible" in result) {
        router.refresh();
      }
    });
  }

  function handleMove() {
    setMoveError(null);
    const target = moveTarget === "__none__" ? null : moveTarget;
    startMoveTransition(async () => {
      const result = await moveCategory(node.id, target);
      if ("error" in result) {
        setMoveError(result.error);
      } else {
        setShowMoveDialog(false);
        router.refresh();
      }
    });
  }

  // Available parents: exclude self and descendants
  const availableMoveTargets = allCategories.filter((c) => c.id !== node.id);

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg border border-border/40 bg-card px-3 py-2 transition-colors hover:border-border hover:bg-secondary/30"
        style={{ paddingRight: `${depth * 20 + 12}px` }}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-secondary"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
            {node.isVisible ? <Folder className="h-4 w-4 text-muted-foreground/50" /> : <FolderOpen className="h-4 w-4 text-muted-foreground/30" />}
          </span>
        )}

        {/* Image thumbnail */}
        {node.imageUrl ? (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border/60">
            <Image
              src={getMediaUrl(node.imageUrl)}
              alt={node.title}
              fill
              className="object-cover"
              unoptimized
              sizes="32px"
            />
          </div>
        ) : null}

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/categories/${node.id}`}
            className="block truncate text-sm font-semibold text-foreground hover:text-primary"
          >
            {node.title}
          </Link>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span dir="ltr">{node.slug}</span>
            <span>•</span>
            <span>{node.postCount} محتوى</span>
            {node.childCount > 0 && (
              <>
                <span>•</span>
                <span>{node.childCount} قسم فرعي</span>
              </>
            )}
          </div>
        </div>

        {/* Visibility badge */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            node.isVisible
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {node.isVisible ? "مرئي" : "مخفي"}
        </span>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            title={node.isVisible ? "إخفاء" : "إظهار"}
          >
            {node.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <Link
            href={`/admin/categories/${node.id}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="تحرير"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setMoveTarget(node.parentId || "__none__");
              setMoveError(null);
              setShowMoveDialog(true);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="نقل"
          >
            <Plus className="h-3.5 w-3.5 rotate-45" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              allCategories={allCategories}
            />
          ))}
        </div>
      )}

      {/* Move dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-navy">
            <h3 className="mb-4 text-lg font-bold text-foreground">نقل القسم</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              اختر القسم الأب الجديد لـ &quot;{node.title}&quot;
            </p>
            <select
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="__none__">بدون أب (قسم رئيسي)</option>
              {availableMoveTargets.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {moveError && <p className="mt-2 text-xs text-red-600">{moveError}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleMove}
                disabled={isMoving}
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {isMoving ? "جاري النقل..." : "نقل"}
              </button>
              <button
                type="button"
                onClick={() => setShowMoveDialog(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
