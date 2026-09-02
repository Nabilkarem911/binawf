import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PostStatus, type HomepageSection, type Category, type Post } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";

async function getSectionPosts(categorySlug: string, limit: number) {
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return [] as (Post & { category: Category | null; featuredImage: { url: string; alt: string | null } | null })[];

  return prisma.post.findMany({
    where: { categoryId: category.id, status: PostStatus.PUBLISHED },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: { category: true, featuredImage: { select: { url: true, alt: true } } },
  });
}

async function getFeaturedCategories() {
  return prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 12,
    include: { image: { select: { url: true, alt: true } } },
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function SectionTitle({ title, subtitle, href }: { title: string; subtitle?: string | null; href?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          عرض الكل <ArrowLeft className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function PostCard({ post }: { post: Post & { category: Category | null; featuredImage: { url: string; alt: string | null } | null } }) {
  return (
    <Link href={`/${post.category?.slug ?? "articles"}/${post.slug}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        {post.featuredImage ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image src={post.featuredImage.url} alt={post.featuredImage.alt ?? post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
          </div>
        ) : null}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {post.publishedAt ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(post.publishedAt)}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight">{post.title}</h3>
        </CardHeader>
        <CardContent>
          {post.excerpt ? <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}

function HeroSection({ section, settings }: { section: HomepageSection; settings: { title: string; subtitle: string } }) {
  const cfg = (section.settings ?? {}) as Record<string, string>;
  const title = cfg.title || settings.title;
  const subtitle = cfg.subtitle || settings.subtitle;
  const cta = cfg.cta || "/art-exhibitions";
  const ctaLabel = cfg.ctaLabel || "استكشف المعارض";

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 py-24 dark:from-stone-900 dark:to-stone-800">
      <div className="container mx-auto px-4 text-center lg:px-8">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        <div className="mt-8 flex justify-center">
          <Link
            href={cta}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {ctaLabel} <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function LatestNewsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const posts = getSectionPosts(String(cfg.categorySlug || "art-education-news"), Number(cfg.limit || 4));
  return (
    <section className="container mx-auto px-4 py-16 lg:px-8">
      <SectionTitle title={section.title} subtitle={section.subtitle} href={`/${String(cfg.categorySlug || "art-education-news")}`} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <LatestPostsRenderer postsPromise={posts} />
      </div>
    </section>
  );
}

async function LatestPostsRenderer({
  postsPromise,
}: {
  postsPromise: Promise<(Post & { category: Category | null; featuredImage: { url: string; alt: string | null } | null })[]>;
}) {
  const posts = await postsPromise;
  if (posts.length === 0) return <EmptyState message="لا توجد أخبار منشورة حالياً." />;
  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="col-span-full text-center text-muted-foreground py-8">{message}</p>;
}

function AnnouncementsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const posts = getSectionPosts(String(cfg.categorySlug || "announcements"), Number(cfg.limit || 4));
  return (
    <section className="container mx-auto bg-muted/30 px-4 py-16 lg:px-8">
      <SectionTitle title={section.title} subtitle={section.subtitle} href={`/${String(cfg.categorySlug || "announcements")}`} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <LatestPostsRenderer postsPromise={posts} />
      </div>
    </section>
  );
}

function GalleriesSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const posts = getSectionPosts(String(cfg.categorySlug || "art-exhibitions"), Number(cfg.limit || 6));
  return (
    <section className="container mx-auto px-4 py-16 lg:px-8">
      <SectionTitle title={section.title} subtitle={section.subtitle} href={`/${String(cfg.categorySlug || "art-exhibitions")}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LatestPostsRenderer postsPromise={posts} />
      </div>
    </section>
  );
}

function StudentWorkSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const posts = getSectionPosts(String(cfg.categorySlug || "student-creations"), Number(cfg.limit || 6));
  return (
    <section className="container mx-auto bg-muted/30 px-4 py-16 lg:px-8">
      <SectionTitle title={section.title} subtitle={section.subtitle} href={`/${String(cfg.categorySlug || "student-creations")}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LatestPostsRenderer postsPromise={posts} />
      </div>
    </section>
  );
}

function AchievementsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const posts = getSectionPosts(String(cfg.categorySlug || "awards-achievements"), Number(cfg.limit || 4));
  return (
    <section className="container mx-auto px-4 py-16 lg:px-8">
      <SectionTitle title={section.title} subtitle={section.subtitle} href={`/${String(cfg.categorySlug || "awards-achievements")}`} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <LatestPostsRenderer postsPromise={posts} />
      </div>
    </section>
  );
}

function FeaturedCategoriesSection({ section }: { section: HomepageSection }) {
  const categoriesPromise = getFeaturedCategories();
  return (
    <section className="container mx-auto bg-muted/30 px-4 py-16 lg:px-8">
      <SectionTitle title={section.title} subtitle={section.subtitle} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CategoriesRenderer categoriesPromise={categoriesPromise} />
      </div>
    </section>
  );
}

async function CategoriesRenderer({ categoriesPromise }: { categoriesPromise: Promise<(Category & { image: { url: string; alt: string | null } | null })[]> }) {
  const categories = await categoriesPromise;
  return (
    <>
      {categories.map((cat) => (
        <Link key={cat.id} href={`/${cat.slug}`}>
          <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
            {cat.image ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image src={cat.image.url} alt={cat.image.alt ?? cat.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
              </div>
            ) : null}
            <CardHeader>
              <h3 className="text-lg font-semibold">{cat.title}</h3>
              {cat.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{cat.description}</p> : null}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </>
  );
}

export function HomepageSectionRenderer({
  section,
  settings,
}: {
  section: HomepageSection;
  settings: { title: string; subtitle: string };
}) {
  switch (section.type) {
    case "HERO":
      return <HeroSection section={section} settings={settings} />;
    case "LATEST_NEWS":
      return <LatestNewsSection section={section} />;
    case "ANNOUNCEMENTS":
      return <AnnouncementsSection section={section} />;
    case "GALLERIES":
      return <GalleriesSection section={section} />;
    case "STUDENT_WORK":
      return <StudentWorkSection section={section} />;
    case "ACHIEVEMENTS":
      return <AchievementsSection section={section} />;
    case "FEATURED_CATEGORIES":
      return <FeaturedCategoriesSection section={section} />;
    default:
      return null;
  }
}
