import Link from "next/link";
import Image from "next/image";
import { formatHijriDate } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { PostStatus, type Post } from "@prisma/client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar, User as UserIcon, ArrowRight, Palette } from "lucide-react";
import { GalleryLightbox } from "@/components/public/GalleryLightbox";
import { ShareButton } from "@/components/public/ShareButton";
import { sanitizeHtml } from "@/lib/sanitize";

type PostWithRelations = Post & {
  author: { name: string } | null;
  category: { title: string; slug: string } | null;
  featuredImage: { url: string; alt: string | null; width: number | null; height: number | null } | null;
  media: { id: string; media: { url: string; alt: string | null; caption: string | null; width: number | null; height: number | null } }[];
};

async function getRelatedPosts(post: PostWithRelations) {
  if (!post.category) return [];
  return prisma.post.findMany({
    where: {
      categoryId: post.categoryId,
      status: PostStatus.PUBLISHED,
      id: { not: post.id },
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 3,
    include: { featuredImage: { select: { url: true, alt: true } } },
  });
}

export async function PostPage({ post }: { post: PostWithRelations }) {
  const related = await getRelatedPosts(post);
  const isGallery = post.type === "GALLERY" || post.type === "VIRTUAL_EXHIBITION";
  const galleryImages = post.media.map((m) => ({
    url: m.media.url,
    alt: m.media.alt ?? post.title,
    caption: m.media.caption ?? null,
  }));
  if (post.featuredImage && !galleryImages.some((g) => g.url === post.featuredImage!.url)) {
    galleryImages.unshift({
      url: post.featuredImage.url,
      alt: post.featuredImage.alt ?? post.title,
      caption: null,
    });
  }

  return (
    <article className="container-page py-8 lg:py-12">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">الرئيسية</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {post.category ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${post.category.slug}`}>{post.category.title}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mx-auto max-w-3xl">
        {post.category ? (
          <Link
            href={`/${post.category.slug}`}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-art-violet/10 px-3.5 py-1.5 text-xs font-semibold text-art-violet transition-colors hover:bg-art-violet/20"
          >
            {post.category.title}
          </Link>
        ) : null}
        <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
          {post.title}
        </h1>

        {/* Metadata */}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.author ? (
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-4 w-4" />
              {post.author.name}
            </span>
          ) : null}
          {post.publishedAt ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatHijriDate(post.publishedAt)}
            </span>
          ) : null}
          <ShareButton />
        </div>
      </div>

      {/* Featured Image — responsive, no crop, preserves aspect ratio */}
      {post.featuredImage ? (
        <div className="mx-auto mt-8 w-full max-w-5xl overflow-hidden rounded-3xl bg-secondary/30">
          {post.featuredImage.width && post.featuredImage.height ? (
            // Use intrinsic dimensions — no crop, no distortion
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt ?? post.title}
              width={post.featuredImage.width}
              height={post.featuredImage.height}
              className="h-auto w-full object-contain"
              priority
              sizes="(max-width: 1200px) 100vw, 75vw"
            />
          ) : (
            // Fallback for images without dimensions — use fill with contain
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alt ?? post.title}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1200px) 100vw, 75vw"
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Excerpt */}
      {post.excerpt ? (
        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl text-pretty">
          {post.excerpt}
        </p>
      ) : null}

      {/* Content */}
      {post.content ? (
        <div
          className="prose-art mx-auto mt-8 max-w-3xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      ) : null}

      {/* Gallery */}
      {isGallery && galleryImages.length > 0 ? (
        <div className="mx-auto mt-12 max-w-5xl">
          <h2 className="font-display mb-5 text-xl font-bold text-foreground">معرض الصور</h2>
          <GalleryLightbox images={galleryImages} />
        </div>
      ) : null}

      {/* Related content */}
      {related.length > 0 ? (
        <div className="mx-auto mt-16 max-w-5xl border-t border-border pt-10">
          <h2 className="font-display mb-6 text-xl font-bold text-foreground">محتوى ذو صلة</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((rp) => (
              <Link key={rp.id} href={`/${post.category?.slug ?? "articles"}/${rp.slug}`} className="group">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  {rp.featuredImage ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image
                        src={rp.featuredImage.url}
                        alt={rp.featuredImage.alt ?? rp.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  ) : (
                    <div className="bg-navy-gradient flex aspect-[16/10] w-full items-center justify-center">
                      <Palette className="h-8 w-8 text-gold/60" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground line-clamp-2 text-sm">{rp.title}</h3>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Back link */}
      <div className="mx-auto mt-12 max-w-3xl border-t border-border pt-6">
        {post.category ? (
          <Link
            href={`/${post.category.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent"
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى {post.category.title}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
