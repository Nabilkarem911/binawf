import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostStatus, PostType } from "@prisma/client";
import { Plus, Search, FileText, Clock, CheckCircle, Archive } from "lucide-react";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  PAGE: "صفحة",
  ARTICLE: "مقال",
  NEWS: "خبر",
  ANNOUNCEMENT: "إعلان",
  PROJECT: "مشروع",
  LESSON: "درس",
  RESEARCH: "بحث",
  AWARD: "جائزة",
  ACHIEVEMENT: "إنجاز",
  GALLERY: "معرض",
  EVENT: "فعالية",
  VIRTUAL_EXHIBITION: "معرض افتراضي",
};

const typeFilters = [
  { value: "", label: "الكل" },
  { value: "NEWS", label: "أخبار" },
  { value: "ANNOUNCEMENT", label: "إعلانات" },
  { value: "ARTICLE", label: "مقالات" },
  { value: "GALLERY", label: "معارض" },
  { value: "LESSON", label: "دروس" },
  { value: "PROJECT", label: "مشروعات" },
  { value: "AWARD", label: "جوائز" },
  { value: "ACHIEVEMENT", label: "إنجازات" },
  { value: "RESEARCH", label: "بحوث" },
  { value: "EVENT", label: "فعاليات" },
  { value: "PAGE", label: "صفحات" },
];

const statusFilters = [
  { value: "", label: "الكل" },
  { value: "PUBLISHED", label: "منشور" },
  { value: "DRAFT", label: "مسودة" },
  { value: "ARCHIVED", label: "مؤرشف" },
];

const PAGE_SIZE = 20;

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string; page?: string }>;
}) {
  await requireAuth();
  const { type, status, q, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const skip = (pageNum - 1) * PAGE_SIZE;

  const where = {
    ...(type ? { type: type as PostType } : {}),
    ...(status ? { status: status as PostStatus } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { category: { select: { title: true, slug: true } }, author: { select: { name: true } } },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = Boolean(type || status || q);

  function buildUrl(changes: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const current = { type, status, q, page };
    const merged = { ...current, ...changes };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/admin/content?${qs}` : "/admin/content";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">المحتوى</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} عنصر إجمالاً</p>
        </div>
        <Link
          href="/admin/content/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          إضافة محتوى
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        {/* Search */}
        <form method="GET" className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="ابحث في العناوين والملخصات..."
              className="h-10 w-full rounded-xl border border-border bg-background pr-10 pl-4 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          {type ? <input type="hidden" name="type" value={type} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
        </form>

        {/* Type filters */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {typeFilters.map((f) => {
            const active = (type || "") === f.value;
            return (
              <Link
                key={f.value || "all"}
                href={buildUrl({ type: f.value || undefined, page: undefined })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((f) => {
            const active = (status || "") === f.value;
            return (
              <Link
                key={f.value || "all"}
                href={buildUrl({ status: f.value || undefined, page: undefined })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <FileText className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-foreground">
              {hasFilters ? "لا توجد نتائج مطابقة" : "لا يوجد محتوى بعد"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters ? "جرّب تغيير عوامل التصفية" : "ابدأ بإضافة محتوى جديد"}
            </p>
            {!hasFilters && (
              <Link
                href="/admin/content/new"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                إضافة محتوى
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-right">
                  <th className="px-4 py-3 font-semibold text-muted-foreground">العنوان</th>
                  <th className="hidden px-4 py-3 font-semibold text-muted-foreground sm:table-cell">القسم</th>
                  <th className="hidden px-4 py-3 font-semibold text-muted-foreground md:table-cell">النوع</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                  <th className="hidden px-4 py-3 font-semibold text-muted-foreground lg:table-cell">آخر تحديث</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/content/${post.id}`}
                        className="font-semibold text-foreground hover:text-primary line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                        {post.category?.title ?? "—"} • {typeLabel[post.type] ?? post.type}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {post.category?.title ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {typeLabel[post.type] ?? post.type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                      {new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(post.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              صفحة {pageNum} من {totalPages}
            </p>
            <div className="flex gap-1.5">
              {pageNum > 1 && (
                <Link
                  href={buildUrl({ page: String(pageNum - 1) })}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  السابق
                </Link>
              )}
              {pageNum < totalPages && (
                <Link
                  href={buildUrl({ page: String(pageNum + 1) })}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  التالي
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const config = {
    PUBLISHED: { label: "منشور", icon: CheckCircle, class: "bg-green-100 text-green-700" },
    DRAFT: { label: "مسودة", icon: Clock, class: "bg-amber-100 text-amber-700" },
    ARCHIVED: { label: "مؤرشف", icon: Archive, class: "bg-gray-100 text-gray-600" },
  };
  const c = config[status] ?? config.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.class}`}>
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
