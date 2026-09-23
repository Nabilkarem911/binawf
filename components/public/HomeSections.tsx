import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PostStatus, type HomepageSection, type Category, type Post } from "@prisma/client";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Megaphone,
  Newspaper,
  Images,
  Palette,
  Trophy,
  Medal,
  Brush,
  Shapes,
  Layers,
  HeartHandshake,
  Frame,
  FolderOpen,
  Star,
  Flag,
  Gem,
  Scissors,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import type { CSSProperties } from "react";

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

/* ── Accent system: each content type owns a color from the art palette ── */
type AccentKey = "sky" | "coral" | "violet" | "emerald" | "teal" | "rose" | "gold";

const ACCENTS: Record<AccentKey, { chip: string; gradient: string; text: string }> = {
  sky: { chip: "bg-art-sky/10 text-art-sky", gradient: "from-art-sky/90 via-navy-light to-navy", text: "text-art-sky" },
  coral: { chip: "bg-art-coral/10 text-art-coral", gradient: "from-art-coral/90 via-navy-light to-navy", text: "text-art-coral" },
  violet: { chip: "bg-art-violet/10 text-art-violet", gradient: "from-art-violet/90 via-navy-light to-navy", text: "text-art-violet" },
  emerald: { chip: "bg-art-emerald/10 text-art-emerald", gradient: "from-art-emerald/90 via-navy-light to-navy", text: "text-art-emerald" },
  teal: { chip: "bg-art-teal/10 text-art-teal", gradient: "from-art-teal/90 via-navy-light to-navy", text: "text-art-teal" },
  rose: { chip: "bg-art-rose/10 text-art-rose", gradient: "from-art-rose/90 via-navy-light to-navy", text: "text-art-rose" },
  gold: { chip: "bg-gold/15 text-gold", gradient: "from-gold/80 via-navy-light to-navy", text: "text-gold" },
};

const SECTION_META: Record<string, { accent: AccentKey; icon: LucideIcon }> = {
  LATEST_NEWS: { accent: "sky", icon: Newspaper },
  ANNOUNCEMENTS: { accent: "coral", icon: Megaphone },
  GALLERIES: { accent: "violet", icon: Images },
  STUDENT_WORK: { accent: "teal", icon: Palette },
  ACHIEVEMENTS: { accent: "gold", icon: Trophy },
  FEATURED_CATEGORIES: { accent: "violet", icon: FolderOpen },
};

const CATEGORY_ACCENTS: AccentKey[] = ["violet", "teal", "coral", "emerald", "sky", "rose", "gold", "violet"];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "special-education": HeartHandshake,
  "art-projects": Layers,
  "drawing-field": Brush,
  ceramics: Shapes,
  decoration: Sparkles,
  "golden-badge": Medal,
  announcements: Megaphone,
  "art-education-news": Newspaper,
  metals: Gem,
  textile: Scissors,
  "art-exhibitions": Frame,
  "student-creations": Palette,
  "art-lessons": GraduationCap,
  "awards-achievements": Trophy,
  "national-day": Flag,
};

function SectionHeader({
  title,
  subtitle,
  href,
  accent = "sky",
  icon: Icon = Sparkles,
}: {
  title: string;
  subtitle?: string | null;
  href?: string;
  accent?: AccentKey;
  icon?: LucideIcon;
}) {
  const a = ACCENTS[accent];
  return (
    <RevealOnScroll>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div className="flex items-center gap-3.5">
          <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${a.chip}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
          </div>
        </div>
        {href ? (
          <Link
            href={href}
            className={`group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground/80 transition-all hover:border-current hover:shadow-card ${a.text}`}
          >
            عرض الكل
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        ) : null}
      </div>
    </RevealOnScroll>
  );
}

/* ═══════════════ Hero ═══════════════ */
type HeroArtwork = { url: string; alt: string | null; title: string };

async function getHeroArtworks(): Promise<HeroArtwork[]> {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, featuredImageId: { not: null } },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 3,
    select: { title: true, featuredImage: { select: { url: true, alt: true } } },
  });
  return posts
    .filter((p): p is typeof p & { featuredImage: { url: string; alt: string | null } } => p.featuredImage !== null)
    .map((p) => ({ url: p.featuredImage.url, alt: p.featuredImage.alt, title: p.title }));
}

async function getHeroStats() {
  const [posts, artworks, categories] = await Promise.all([
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED, featuredImageId: { not: null } } }),
    prisma.category.count({ where: { isVisible: true } }),
  ]);
  return { posts, artworks, categories };
}

const HERO_SLOTS = [
  { className: "top-0 right-2 w-44 h-52 lg:w-60 lg:h-72", rotate: "-5deg", delay: "0s" },
  { className: "top-20 left-0 w-40 h-48 lg:w-52 lg:h-60", rotate: "6deg", delay: "1.1s" },
  { className: "bottom-0 right-28 w-44 h-52 lg:w-56 lg:h-64", rotate: "2.5deg", delay: "2s" },
];
const HERO_FALLBACK_ICONS: LucideIcon[] = [Palette, Brush, Sparkles];

async function HeroSection({ section, settings }: { section: HomepageSection; settings: { title: string; subtitle: string; description: string } }) {
  const cfg = (section.settings ?? {}) as Record<string, string>;
  const title = cfg.title || settings.title;
  const subtitle = cfg.subtitle || settings.subtitle;
  const cta = cfg.cta || "/art-exhibitions";
  const ctaLabel = cfg.ctaLabel || "استكشف المعارض";
  const secondaryCta = cfg.secondaryCta || "/art-education-news";
  const secondaryCtaLabel = cfg.secondaryCtaLabel || "آخر الأخبار";
  const [artworks, stats] = await Promise.all([getHeroArtworks(), getHeroStats()]);

  const statItems = [
    { value: stats.posts, label: "محتوى منشور" },
    { value: stats.artworks, label: "عمل فني" },
    { value: stats.categories, label: "مجال تعليمي" },
  ].filter((s) => s.value > 0);

  return (
    <section className="gradient-mesh grain relative overflow-hidden text-white">
      {/* Geometric dot pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
        <defs>
          <pattern id="hero-dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>

      <div className="container-page relative z-10 py-14 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Copy */}
          <div className="text-center lg:text-start">
            <RevealOnScroll>
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-gold-light">
                <Sparkles className="h-4 w-4" />
                التربية الفنية • مدرسة عبد الرحمن بن عوف
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={90}>
              <h1 className="font-display mt-6 text-4xl leading-[1.15] font-black tracking-tight text-balance sm:text-5xl lg:text-6xl">
                <span className="text-gradient-gold">{title}</span>
              </h1>
            </RevealOnScroll>
            <RevealOnScroll delay={180}>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/75 text-pretty sm:text-xl lg:mx-0">
                {subtitle || settings.description}
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={270}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href={cta}
                  className="bg-gold-gradient inline-flex h-12 items-center gap-2 rounded-full px-8 text-base font-bold text-gold-foreground shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:px-9"
                >
                  {ctaLabel}
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <Link
                  href={secondaryCta}
                  className="glass inline-flex h-12 items-center gap-2 rounded-full px-8 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 sm:px-9"
                >
                  {secondaryCtaLabel}
                </Link>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={360}>
              {statItems.length > 0 ? (
                <dl className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-white/10 pt-6 lg:justify-start">
                  {statItems.map((s) => (
                    <div key={s.label}>
                      <dt className="sr-only">{s.label}</dt>
                      <dd className="font-display text-2xl font-black text-white sm:text-3xl">
                        {s.value}
                        <span className="text-gold">+</span>
                      </dd>
                      <dd className="mt-0.5 text-xs text-white/60 sm:text-sm">{s.label}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </RevealOnScroll>
          </div>

          {/* Floating artwork collage — desktop/tablet */}
          <div className="relative mx-auto hidden w-full max-w-md sm:block lg:max-w-none" aria-hidden="true">
            <div className="relative h-[380px] lg:h-[460px]">
              <div className="absolute inset-6 rotate-3 rounded-[3rem] border border-white/10" />
              <div className="absolute inset-14 -rotate-2 rounded-[3rem] border border-gold/15" />
              {HERO_SLOTS.map((slot, i) => {
                const art = artworks[i];
                const FallbackIcon = HERO_FALLBACK_ICONS[i];
                return (
                  <div
                    key={i}
                    className={`absolute overflow-hidden rounded-3xl shadow-navy ${i % 2 === 1 ? "animate-float-slow" : "animate-float"} ${slot.className}`}
                    style={{ "--float-rotate": slot.rotate, transform: `rotate(${slot.rotate})`, animationDelay: slot.delay } as CSSProperties}
                  >
                    {art ? (
                      <>
                        <Image src={art.url} alt={art.alt ?? art.title} fill className="object-cover" sizes="240px" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
                        <p className="absolute inset-x-3 bottom-3 line-clamp-1 text-xs font-semibold text-white">{art.title}</p>
                      </>
                    ) : (
                      <div className="glass flex h-full w-full items-center justify-center">
                        <FallbackIcon className="h-10 w-10 text-gold" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact artwork strip — mobile only */}
          {artworks.length > 0 ? (
            <div className="flex justify-center gap-3 sm:hidden">
              {artworks.map((art, i) => (
                <div key={i} className="glass relative h-20 w-24 overflow-hidden rounded-2xl">
                  <Image src={art.url} alt={art.alt ?? art.title} fill className="object-cover" sizes="96px" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-l from-art-violet via-gold to-art-teal" aria-hidden="true" />
    </section>
  );
}

/* ═══════════════ Featured Categories ═══════════════ */
function FeaturedCategoriesSection({ section }: { section: HomepageSection }) {
  const meta = SECTION_META.FEATURED_CATEGORIES;
  return (
    <section className="container-page py-12 lg:py-16">
      <SectionHeader title={section.title} subtitle={section.subtitle} accent={meta.accent} icon={meta.icon} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <CategoriesRenderer categoriesPromise={getFeaturedCategories()} />
      </div>
    </section>
  );
}

async function CategoriesRenderer({ categoriesPromise }: { categoriesPromise: Promise<CategoryWithImage[]> }) {
  const categories = await categoriesPromise;
  if (categories.length === 0) return null;
  return (
    <>
      {categories.map((cat, i) => {
        const accent = ACCENTS[CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length]];
        const Icon = CATEGORY_ICONS[cat.slug] ?? FolderOpen;
        return (
          <RevealOnScroll key={cat.id} delay={(i % 4) * 70} className="h-full">
            <Link href={`/${cat.slug}`} className="group block h-full">
              <article
                className={`relative flex h-48 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-navy sm:h-52 ${accent.gradient}`}
              >
                {cat.image ? (
                  <Image
                    src={cat.image.url}
                    alt={cat.image.alt ?? cat.title}
                    fill
                    className="object-cover opacity-45 transition-all duration-700 group-hover:scale-110 group-hover:opacity-35"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
                <div className="relative flex items-start justify-between">
                  <span className="glass inline-flex rounded-2xl p-2.5">
                    <Icon className="h-5 w-5" />
                  </span>
                  {cat._count && cat._count.posts > 0 ? (
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                      {cat._count.posts} محتوى
                    </span>
                  ) : null}
                </div>
                <div className="relative">
                  <h3 className="font-display text-lg font-bold">{cat.title}</h3>
                  {cat.description ? <p className="mt-1 line-clamp-1 text-sm text-white/70">{cat.description}</p> : null}
                  <span className="mt-2 inline-flex translate-y-1 items-center gap-1 text-xs font-semibold text-gold-light opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    استكشف
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            </Link>
          </RevealOnScroll>
        );
      })}
    </>
  );
}

/* ═══════════════ Latest News — editorial layout ═══════════════ */
function LatestNewsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "art-education-news");
  const limit = Number(cfg.limit || 5);
  return <NewsRenderer postsPromise={getSectionPosts(slug, limit)} section={section} slug={slug} />;
}

async function NewsRenderer({
  postsPromise,
  section,
  slug,
}: {
  postsPromise: Promise<PostWithRelations[]>;
  section: HomepageSection;
  slug: string;
}) {
  const posts = await postsPromise;
  if (posts.length === 0) return null;
  const meta = SECTION_META.LATEST_NEWS;
  const [featured, ...rest] = posts;
  return (
    <section className="container-page py-12 lg:py-16">
      <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} accent={meta.accent} icon={meta.icon} />
      <div className="grid gap-6 lg:grid-cols-5">
        <RevealOnScroll className="h-full lg:col-span-3">
          {/* Featured story — full-bleed image */}
          <Link href={`/${featured.category?.slug ?? "articles"}/${featured.slug}`} className="group block h-full">
            <article className="bg-navy-gradient relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl text-white shadow-card sm:min-h-[380px]">
              {featured.featuredImage ? (
                <Image
                  src={featured.featuredImage.url}
                  alt={featured.featuredImage.alt ?? featured.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-transparent" />
              <div className="relative p-6 sm:p-8">
                <div className="mb-3 flex items-center gap-2 text-xs">
                  {featured.category ? (
                    <span className="rounded-full bg-art-sky/25 px-3 py-1 font-semibold text-white backdrop-blur-sm">{featured.category.title}</span>
                  ) : null}
                  {featured.publishedAt ? (
                    <span className="inline-flex items-center gap-1 text-white/70">
                      <Calendar className="h-3 w-3" />
                      {formatDate(featured.publishedAt)}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-display text-xl font-bold leading-snug text-balance sm:text-2xl lg:text-3xl">{featured.title}</h3>
                {featured.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-white/75 sm:text-base">{featured.excerpt}</p> : null}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-light">
                  اقرأ المزيد
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </span>
              </div>
            </article>
          </Link>
        </RevealOnScroll>
        {rest.length > 0 ? (
          <div className="flex flex-col gap-4 lg:col-span-2">
            {rest.slice(0, 4).map((post, i) => (
              <RevealOnScroll key={post.id} delay={(i + 1) * 80}>
                {/* Compact horizontal row */}
                <Link href={`/${post.category?.slug ?? "articles"}/${post.slug}`} className="group block">
                  <article className="flex h-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-art-sky/40 hover:shadow-card-hover">
                    {post.featuredImage ? (
                      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt ?? post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="96px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-secondary">
                        <Newspaper className="h-6 w-6 text-art-sky/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-art-sky sm:text-base">
                        {post.title}
                      </h4>
                      {post.publishedAt ? (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.publishedAt)}
                        </p>
                      ) : null}
                    </div>
                    <ArrowLeft className="h-4 w-4 shrink-0 text-border transition-all group-hover:-translate-x-1 group-hover:text-art-sky" />
                  </article>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ═══════════════ Announcements — compact alert rows ═══════════════ */
function AnnouncementsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "announcements");
  const limit = Number(cfg.limit || 4);
  return <AnnouncementsRenderer postsPromise={getSectionPosts(slug, limit)} section={section} slug={slug} />;
}

async function AnnouncementsRenderer({
  postsPromise,
  section,
  slug,
}: {
  postsPromise: Promise<PostWithRelations[]>;
  section: HomepageSection;
  slug: string;
}) {
  const posts = await postsPromise;
  if (posts.length === 0) return null;
  const meta = SECTION_META.ANNOUNCEMENTS;
  return (
    <section className="section-tint py-12 lg:py-16" style={{ "--tint": "var(--art-coral)" } as CSSProperties}>
      <div className="container-page">
        <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} accent={meta.accent} icon={meta.icon} />
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post, i) => (
            <RevealOnScroll key={post.id} delay={(i % 2) * 80} className="h-full">
              <Link href={`/${post.category?.slug ?? "articles"}/${post.slug}`} className="group block h-full">
                <article className="flex h-full items-start gap-4 rounded-2xl border border-border/60 bg-card/85 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-art-coral/40 hover:shadow-card-hover">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-art-coral/10 text-art-coral">
                    <Megaphone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 font-bold leading-snug text-foreground transition-colors group-hover:text-art-coral">{post.title}</h3>
                    {post.excerpt ? <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p> : null}
                    {post.publishedAt ? (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt)}
                      </p>
                    ) : null}
                  </div>
                </article>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ Masonry image wall (galleries / student work) ═══════════════ */
function MasonryWall({
  posts,
  hrefFor,
}: {
  posts: PostWithRelations[];
  hrefFor: (post: PostWithRelations) => string;
}) {
  return (
    <div className="grid auto-rows-[150px] grid-flow-dense grid-cols-2 gap-4 sm:auto-rows-[190px] lg:grid-cols-4">
      {posts.map((post, i) => {
        const tall = i % 5 === 0;
        return (
          <RevealOnScroll key={post.id} delay={(i % 4) * 60} className={tall ? "row-span-2" : ""}>
            <Link href={hrefFor(post)} className="group relative block h-full overflow-hidden rounded-3xl bg-navy-gradient">
              {post.featuredImage ? (
                <Image
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt ?? post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-white/25" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-display line-clamp-2 text-sm font-bold text-white sm:text-base">{post.title}</h3>
                {post.category ? <p className="mt-1 text-xs text-white/65">{post.category.title}</p> : null}
              </div>
            </Link>
          </RevealOnScroll>
        );
      })}
    </div>
  );
}

function postHref(post: PostWithRelations) {
  return `/${post.category?.slug ?? "articles"}/${post.slug}`;
}

/* ═══════════════ Galleries ═══════════════ */
function GalleriesSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "art-exhibitions");
  const limit = Number(cfg.limit || 6);
  return <GalleriesRenderer postsPromise={getSectionPosts(slug, limit)} section={section} slug={slug} />;
}

async function GalleriesRenderer({
  postsPromise,
  section,
  slug,
}: {
  postsPromise: Promise<PostWithRelations[]>;
  section: HomepageSection;
  slug: string;
}) {
  const posts = await postsPromise;
  if (posts.length === 0) return null;
  const meta = SECTION_META.GALLERIES;
  return (
    <section className="container-page py-12 lg:py-16">
      <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} accent={meta.accent} icon={meta.icon} />
      <MasonryWall posts={posts} hrefFor={postHref} />
    </section>
  );
}

/* ═══════════════ Student Work ═══════════════ */
function StudentWorkSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "student-creations");
  const limit = Number(cfg.limit || 6);
  return <StudentWorkRenderer postsPromise={getSectionPosts(slug, limit)} section={section} slug={slug} />;
}

async function StudentWorkRenderer({
  postsPromise,
  section,
  slug,
}: {
  postsPromise: Promise<PostWithRelations[]>;
  section: HomepageSection;
  slug: string;
}) {
  const posts = await postsPromise;
  if (posts.length === 0) return null;
  const meta = SECTION_META.STUDENT_WORK;
  return (
    <section className="section-tint py-12 lg:py-16" style={{ "--tint": "var(--art-teal)" } as CSSProperties}>
      <div className="container-page">
        <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} accent={meta.accent} icon={meta.icon} />
        <MasonryWall posts={posts} hrefFor={postHref} />
      </div>
    </section>
  );
}

/* ═══════════════ Achievements — medal cards ═══════════════ */
function AchievementsSection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string | number>;
  const slug = String(cfg.categorySlug || "awards-achievements");
  const limit = Number(cfg.limit || 4);
  return <AchievementsRenderer postsPromise={getSectionPosts(slug, limit)} section={section} slug={slug} />;
}

const ACHIEVEMENT_ICONS: LucideIcon[] = [Trophy, Medal, Star, Sparkles];

async function AchievementsRenderer({
  postsPromise,
  section,
  slug,
}: {
  postsPromise: Promise<PostWithRelations[]>;
  section: HomepageSection;
  slug: string;
}) {
  const posts = await postsPromise;
  if (posts.length === 0) return null;
  const meta = SECTION_META.ACHIEVEMENTS;
  return (
    <section className="container-page py-12 lg:py-16">
      <SectionHeader title={section.title} subtitle={section.subtitle} href={`/${slug}`} accent={meta.accent} icon={meta.icon} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post, i) => {
          const Icon = ACHIEVEMENT_ICONS[i % ACHIEVEMENT_ICONS.length];
          return (
            <RevealOnScroll key={post.id} delay={(i % 4) * 70} className="h-full">
              <Link href={postHref(post)} className="group block h-full">
                <article className="relative flex h-full flex-col items-center overflow-hidden rounded-3xl border border-border/60 bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-card-hover">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gold-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/12 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="font-display line-clamp-2 font-bold leading-snug text-foreground">{post.title}</h3>
                  {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p> : null}
                  {post.publishedAt ? (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.publishedAt)}
                    </span>
                  ) : null}
                </article>
              </Link>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════ CTA ═══════════════ */
function CTASection({ section }: { section: HomepageSection }) {
  const cfg = (section.settings ?? {}) as Record<string, string>;
  return (
    <section className="container-page py-12 lg:py-16">
      <RevealOnScroll>
        <div className="gradient-mesh grain relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white sm:px-12 lg:py-18">
          <div className="absolute -top-16 right-10 h-48 w-48 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full border border-gold/15" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl lg:text-4xl">{section.title}</h2>
            {section.subtitle ? <p className="mt-4 text-lg text-white/75">{section.subtitle}</p> : null}
            {cfg.cta ? (
              <Link
                href={cfg.cta}
                className="bg-gold-gradient mt-8 inline-flex h-12 items-center gap-2 rounded-full px-9 text-base font-bold text-gold-foreground shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                {cfg.ctaLabel || "استكشف المزيد"}
                <ArrowLeft className="h-5 w-5" />
              </Link>
            ) : null}
          </div>
        </div>
      </RevealOnScroll>
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
