import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PostStatus, type HomepageSection, type Category, type Post } from "@prisma/client";
import { ArrowLeft, Calendar, Sparkles, Image as ImageIcon } from "lucide-react";

type PostWithRelations = Post & {
  category: { title: string; slug: string } | null;
  featuredImage: { url: string; alt: string | null } | null;
};

type CategoryWithImage = Category & {
  image: { url: string; alt: string | null } | null;
  _count?: { posts: number };
};

async function getSectionPosts(categorySlug: string, limit: number): Promise<PostWithRelations[]> {
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return [];
  return prisma.post.findMany({
    where: { categoryId: category.id, status: PostStatus.PUBLISHED },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: { category: { select: { title: true, slug: true } }, featuredImage: { select: { url: true, alt: true } } },
  });
}

async function getFeaturedCategories(): Promise<CategoryWithImage[]> {
  return prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 8,
    include: { image: { select: { url: true, alt: true } }, _count: { select: { posts: true } } },
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string | null; href?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-accent"
        >
          عرض الكل
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}

function PostCard({ post, featured = false }: { post: PostWithRelations; featured?: boolean }) {
  const href = `/${post.category?.slug ?? "articles"}/${post.slug}`;
  return (
    <Link href={href} className="group block h-full">
      <article
        className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:shadow-card-hover hover:border-border ${featured ? "sm:flex-row" : ""}`}
      >
        {post.featuredImage ? (
          <div className={`relative overflow-hidden ${featured ? "sm:w-1/2" : "aspect-[16/10] w-full"}`}>
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt ?? post.title}
              fill={featured}
              width={featured ? undefined : 800}
              height={featured ? undefined : 500}
              className={`${featured ? "h-full w-full" : ""} object-cover transition-transform duration-500 group-hover:scale-105`}
              sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center bg-secondary ${featured ? "sm:w-1/2 aspect-[16/10] sm:aspect-auto" : "aspect-[16/10] w-full"}`}>
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className={`flex flex-1 flex-col p-5 ${featured ? "sm:p-8 sm:justify-center" : ""}`}>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            {post.category ? (
              <span className="font-semibold text-accent">{post.category.title}</span>
            ) : null}
            {post.publishedAt ? (
              <>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatDate(post.publishedAt)}
                </span>
              </>
            ) : null}
          </div>
          <h3 className={`font-bold leading-snug text-foreground ${featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"} line-clamp-2`}>
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className={`mt-2 text-sm text-muted-foreground ${featured ? "line-clamp-3 sm:text-base" : "line-clamp-2"}`}>
              {post.excerpt}
            </p>
          ) : null}
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors group-hover:text-accent">
            اقرأ المزيد
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

/* ── Hero ── */
function HeroSection({ section, settings }: { section: HomepageSection; settings: { title: string; subtitle: string; description: string } }) {
  const cfg = (section.settings ?? {}) as Record<string, string>;
  const title = cfg.title || settings.title;
  const subtitle = cfg.subtitle || settings.subtitle;
  const cta = cfg.cta || "/art-exhibitions";
  const ctaLabel = cfg.ctaLabel || "استكشف المعارض";
  const secondaryCta = cfg.secondaryCta || "/art-education-news";
  const secondaryCtaLabel = cfg.secondaryCtaLabel || "آخر الأخبار";

  return (
    <section className="relative overflow-hidden bg-navy-gradient text-white">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="container-page relative py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
            <Sparkles className="h-4 w-4" />
            التربية الفنية • مدرسة عبد الرحمن بن عوف
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80 text-pretty sm:text-xl">
            {subtitle || settings.description}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={cta}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gold px-8 text-base font-bold text-gold-foreground shadow-lg transition-all hover:bg-gold-light hover:shadow-xl sm:px-10"
            >
              {ctaLabel}
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link
              href={secondaryCta}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:px-10"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom wave separator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-gold via-gold-light to-gold" aria-hidden="true" />
    </section>
  );
}

/* ── Featured Categories ── */
function FeaturedCategoriesSection({ section }: { section: HomepageSection }) {
  const categoriesPromise = getFeaturedCategories();
  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeader title={section.title} subtitle={section.subtitle} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <CategoriesRenderer categoriesPromise={categoriesPromise} />
      </div>
    </section>
  );
}

async function CategoriesRenderer({ categoriesPromise }: { categoriesPromise: Promise<CategoryWithImage[]> }) {
  const categories = await categoriesPromise;
  if (categories.length === 0) return <EmptyState message="لا توجد أقسام متاحة حالياً." />;
  return (
    <>
      {categories.map((cat) => (
        <Link key={cat.id} href={`/${cat.slug}`} className="group">
          <article className="relative flex h-44 flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-navy-gradient p-5 text-white transition-all duration-300 hover:shadow-card-hover sm:h-48">
            {cat.image ? (
              <Image
                src={cat.image.url}
                alt={cat.image.alt ?? cat.title}
                fill
                className="object-cover opacity-50 transition-all duration-500 group-hover:scale-110 group-hover:opacity-40"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
            <div className="relative">
              <h3 className="text-lg font-bold text-white">{cat.title}</h3>
              {cat.description ? (
                <p className="mt-1 line-clamp-1 text-sm text-white/70">{cat.description}</p>
              ) : null}
            </div>
          </article>
        </Link>
      ))}
    </>
  );
}

/* ── Latest News (featured + grid) ── */
function LatestNewsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "art-education-news");
  const limit = Number(cfg.limit || 5);
  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} />
      <NewsRenderer postsPromise={getSectionPosts(slug, limit)} />
    </section>
  );
}

async function NewsRenderer({ postsPromise }: { postsPromise: Promise<PostWithRelations[]> }) {
  const posts = await postsPromise;
  if (posts.length === 0) return <EmptyState message="لا توجد أخبار منشورة حالياً." />;
  const [featured, ...rest] = posts;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PostCard post={featured} featured />
      <div className="grid gap-5 sm:grid-cols-2">
        {rest.slice(0, 4).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

/* ── Announcements ── */
function AnnouncementsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "announcements");
  const limit = Number(cfg.limit || 4);
  return (
    <section className="bg-cream py-16 lg:py-20">
      <div className="container-page">
        <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SimplePostRenderer postsPromise={getSectionPosts(slug, limit)} />
        </div>
      </div>
    </section>
  );
}

/* ── Galleries ── */
function GalleriesSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "art-exhibitions");
  const limit = Number(cfg.limit || 6);
  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SimplePostRenderer postsPromise={getSectionPosts(slug, limit)} />
      </div>
    </section>
  );
}

/* ── Student Work ── */
function StudentWorkSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "student-creations");
  const limit = Number(cfg.limit || 6);
  return (
    <section className="bg-cream py-16 lg:py-20">
      <div className="container-page">
        <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SimplePostRenderer postsPromise={getSectionPosts(slug, limit)} />
        </div>
      </div>
    </section>
  );
}

/* ── Achievements ── */
function AchievementsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "awards-achievements");
  const limit = Number(cfg.limit || 4);
  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <SimplePostRenderer postsPromise={getSectionPosts(slug, limit)} />
      </div>
    </section>
  );
}

async function SimplePostRenderer({ postsPromise }: { postsPromise: Promise<PostWithRelations[]> }) {
  const posts = await postsPromise;
  if (posts.length === 0) return <EmptyState message="لا يوجد محتوى منشور حالياً." />;
  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}

/* ── CTA Section ── */
function CTASection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string>;
  return (
    <section className="container-page py-16 lg:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-navy-gradient px-6 py-14 text-center text-white sm:px-12 lg:py-20">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">{section.title}</h2>
          {section.subtitle ? <p className="mt-4 text-lg text-white/80">{section.subtitle}</p> : null}
          {cfg.cta ? (
            <Link
              href={cfg.cta}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-gold px-8 text-base font-bold text-gold-foreground shadow-lg transition-all hover:bg-gold-light sm:px-10"
            >
              {cfg.ctaLabel || "استكشف المزيد"}
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function HomepageSectionRenderer({
  section,
  settings,
}: {
  section: HomepageSection;
  settings: { title: string; subtitle: string; description: string };
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
    case "CUSTOM":
      return <CTASection section={section} />;
    default:
      return null;
  }
}
