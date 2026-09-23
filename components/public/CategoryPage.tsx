import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PostStatus, type Category } from "@prisma/client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar, ArrowLeft, Image as ImageIcon, FolderTree, Palette } from "lucide-react";

type CategoryWithImage = Category & {
  image: { url: string; alt: string | null } | null;
};

type PostWithImage = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  isFeatured: boolean;
  category: { title: string; slug: string } | null;
  featuredImage: { url: string; alt: string | null } | null;
};

async function getCategoryData(category: Category) {
  const [children, posts, parentChain] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: category.id, isVisible: true },
      orderBy: { sortOrder: "asc" },
      include: { image: { select: { url: true, alt: true } }, _count: { select: { posts: true } } },
    }),
    prisma.post.findMany({
      where: { categoryId: category.id, status: PostStatus.PUBLISHED },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      include: { featuredImage: { select: { url: true, alt: true } }, category: { select: { title: true, slug: true } } },
    }),
    getParentChain(category.id),
  ]);
  return { children, posts, parentChain };
}

async function getParentChain(categoryId: string, chain: { id: string; title: string; slug: string }[] = []): Promise<{ id: string; title: string; slug: string }[]> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, title: true, slug: true, parentId: true },
  });
  if (!category) return chain;
  chain.unshift({ id: category.id, title: category.title, slug: category.slug });
  if (category.parentId) return getParentChain(category.parentId, chain);
  return chain;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export async function CategoryPage({ category }: { category: CategoryWithImage }) {
  const { children, posts, parentChain } = await getCategoryData(category);
  const isGallery = category.contentType === "GALLERY" || category.contentType === "VIRTUAL_EXHIBITION";

  return (
    <div className="container-page py-8 lg:py-12">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">الرئيسية</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {parentChain.slice(0, -1).map((parent) => (
            <span key={parent.id} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${parent.slug}`}>{parent.title}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </span>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>{category.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Category Header */}
      <div className="mb-10">
        {category.image ? (
          <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-[2rem]">
            <Image
              src={category.image.url}
              alt={category.image.alt ?? category.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1200px) 100vw, 75vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
            <div className="absolute bottom-0 right-0 left-0 p-6 sm:p-8 lg:p-10">
              <h1 className="font-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">{category.title}</h1>
              {category.description ? (
                <p className="mt-2 max-w-2xl text-base text-white/85 sm:text-lg">{category.description}</p>
              ) : null}
              {posts.length > 0 ? (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {posts.length} محتوى
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="gradient-mesh grain relative mb-6 overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-10 sm:py-12">
            <div className="relative z-10">
              <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{category.title}</h1>
              {category.description ? (
                <p className="mt-3 max-w-2xl text-base text-white/75 sm:text-lg">{category.description}</p>
              ) : null}
              {posts.length > 0 ? (
                <span className="glass mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white">
                  {posts.length} محتوى
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Sub-categories */}
      {children.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display mb-5 flex items-center gap-2 text-xl font-bold text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-art-violet/10 text-art-violet">
              <FolderTree className="h-4 w-4" />
            </span>
            الأقسام الفرعية
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {children.map((child) => (
              <Link key={child.id} href={`/${child.slug}`} className="group">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  {child.image ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image
                        src={child.image.url}
                        alt={child.image.alt ?? child.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="25vw"
                      />
                    </div>
                  ) : (
                    <div className="bg-navy-gradient flex aspect-[16/10] w-full items-center justify-center">
                      <Palette className="h-8 w-8 text-gold/60" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground line-clamp-1">{child.title}</h3>
                    {child.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{child.description}</p>
                    ) : null}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <section>
          <h2 className="font-display mb-5 text-xl font-bold text-foreground">المحتوى</h2>
          {isGallery ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <GalleryCard key={post.id} post={post} categorySlug={category.slug} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} categorySlug={category.slug} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {children.length === 0 && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">لا يوجد محتوى منشور في هذا القسم حالياً</p>
          <p className="mt-1 text-sm text-muted-foreground">قد يتم إضافة محتوى قريباً. تابعنا للاطلاع على المستجدات.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent"
          >
            العودة للرئيسية
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, categorySlug }: { post: PostWithImage; categorySlug: string }) {
  return (
    <Link href={`/${categorySlug}/${post.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
        {post.featuredImage ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt ?? post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        ) : (
          <div className="bg-navy-gradient flex aspect-[16/10] w-full items-center justify-center">
            <Palette className="h-9 w-9 text-gold/60" />
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          {post.publishedAt ? (
            <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt)}
            </div>
          ) : null}
          <h3 className="font-bold leading-snug text-foreground line-clamp-2">{post.title}</h3>
          {post.excerpt ? (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
          ) : null}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-accent">
            اقرأ المزيد
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function GalleryCard({ post, categorySlug }: { post: PostWithImage; categorySlug: string }) {
  return (
    <Link href={`/${categorySlug}/${post.slug}`} className="group block">
      <article className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt ?? post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-0 right-0 left-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <h3 className="text-sm font-bold text-white line-clamp-2">{post.title}</h3>
          {post.publishedAt ? (
            <p className="mt-1 text-xs text-white/70">{formatDate(post.publishedAt)}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
