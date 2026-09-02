import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { FileText, FolderTree, Image as ImageIcon, Layers, TrendingUp, Clock, ArrowLeft, Plus } from "lucide-react";

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

export default async function AdminDashboardPage() {
  await requireAuth();

  const [postsCount, categoriesCount, mediaCount, publishedCount, draftCount, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.category.count(),
    prisma.media.count(),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { category: { select: { title: true } }, author: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { title: "إجمالي المحتوى", value: postsCount, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "المنشور", value: publishedCount, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { title: "المسودات", value: draftCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "الأقسام", value: categoriesCount, icon: FolderTree, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "الوسائط", value: mediaCount, icon: ImageIcon, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-muted-foreground">نظرة عامة على موقع موهبة فنان</p>
        </div>
        <Link
          href="/admin/content/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          إضافة محتوى
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent content */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Layers className="h-5 w-5 text-accent" />
            أحدث المحتوى
          </h2>
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent"
          >
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentPosts.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-muted-foreground">لا يوجد محتوى بعد. ابدأ بإضافة محتوى جديد.</p>
              <Link
                href="/admin/content/new"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent"
              >
                <Plus className="h-4 w-4" />
                إضافة محتوى
              </Link>
            </div>
          ) : (
            recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/content/${post.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground line-clamp-1">{post.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {post.category ? <span>{post.category.title}</span> : null}
                    <span>•</span>
                    <span>{typeLabel[post.type] ?? post.type}</span>
                    {post.author ? (
                      <>
                        <span>•</span>
                        <span>{post.author.name}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      post.status === PostStatus.PUBLISHED
                        ? "bg-green-100 text-green-700"
                        : post.status === PostStatus.DRAFT
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.status === PostStatus.PUBLISHED ? "منشور" : post.status === PostStatus.DRAFT ? "مسودة" : "مؤرشف"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("ar-SA", { month: "short", day: "numeric" }).format(post.updatedAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "إضافة مقال", href: "/admin/content/new", icon: FileText, desc: "اكتب مقالاً أو خبراً جديداً" },
          { title: "إضافة قسم", href: "/admin/categories/new", icon: FolderTree, desc: "أنشئ قسماً جديداً للموقع" },
          { title: "رفع وسائط", href: "/admin/media", icon: ImageIcon, desc: "ارفع صوراً وملفات للمكتبة" },
          { title: "إعدادات الموقع", href: "/admin/settings", icon: Layers, desc: "عدّل إعدادات الموقع العامة" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-border/60 bg-card p-5 transition-all hover:shadow-card-hover hover:border-border"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <action.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-bold text-foreground">{action.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
