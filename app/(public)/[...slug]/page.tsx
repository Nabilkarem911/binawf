import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { CategoryPage } from "@/components/public/CategoryPage";
import { PostPage } from "@/components/public/PostPage";

// ISR: Next 16 requires generateStaticParams to enable output caching on a
// dynamic route — an empty array prerenders nothing (no DB needed at build)
// while dynamicParams lets unknown slugs render on-demand and get cached.
// CMS writes bust the cache instantly via revalidatePublic().
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

type PageParams = {
  slug: string[];
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const lastSlug = slug[slug.length - 1];
  const fullSlug = slug.join("/");

  const category = await prisma.category.findUnique({ where: { slug: lastSlug } });
  if (category) {
    return {
      title: category.title,
      description: category.description || category.title,
      alternates: { canonical: `${siteUrl}/${fullSlug}` },
      openGraph: {
        title: category.title,
        description: category.description || category.title,
        url: `${siteUrl}/${fullSlug}`,
        type: "website",
      },
    };
  }

  if (slug.length >= 2) {
    const parentSlug = slug[slug.length - 2];
    const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
    if (parent) {
      const post = await prisma.post.findUnique({
        where: { slug_categoryId: { slug: lastSlug, categoryId: parent.id } },
        include: { featuredImage: { select: { url: true } } },
      });
      if (post) {
        const ogImages = post.featuredImage
          ? [{ url: post.featuredImage.url.startsWith("http") ? post.featuredImage.url : `${siteUrl}${post.featuredImage.url}` }]
          : [];

        return {
          title: post.metaTitle || post.title,
          description: post.metaDescription || post.excerpt || post.title,
          alternates: { canonical: `${siteUrl}/${fullSlug}` },
          openGraph: {
            title: post.metaTitle || post.title,
            description: post.metaDescription || post.excerpt || post.title,
            url: `${siteUrl}/${fullSlug}`,
            type: "article",
            publishedTime: post.publishedAt?.toISOString(),
            images: ogImages,
          },
          twitter: {
            card: "summary_large_image",
            images: ogImages.map((i) => i.url),
          },
        };
      }
    }
  }

  return { title: "الصفحة غير موجودة" };
}

export default async function DynamicPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const lastSlug = slug[slug.length - 1];
  const fullSlug = slug.join("/");

  const category = await prisma.category.findUnique({
    where: { slug: lastSlug },
    include: {
      image: { select: { url: true, alt: true } },
      parent: true,
    },
  });

  if (category) {
    const categoryJsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.title,
      description: category.description || category.title,
      url: `${siteUrl}/${fullSlug}`,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
        />
        <CategoryPage category={category} />
      </>
    );
  }

  if (slug.length >= 2) {
    const parentSlug = slug[slug.length - 2];
    const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
    if (parent) {
      const post = await prisma.post.findUnique({
        where: { slug_categoryId: { slug: lastSlug, categoryId: parent.id } },
        include: {
          author: { select: { name: true } },
          category: { select: { title: true, slug: true } },
          featuredImage: { select: { url: true, alt: true, width: true, height: true } },
          media: { include: { media: { select: { url: true, alt: true, caption: true, width: true, height: true } } } },
        },
      });
      if (post && post.status === PostStatus.PUBLISHED) {
        const articleJsonLd = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt || post.metaDescription || post.title,
          url: `${siteUrl}/${fullSlug}`,
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          author: post.author ? { "@type": "Person", name: post.author.name } : undefined,
          publisher: {
            "@type": "EducationalOrganization",
            name: "موهبة فنان - مدرسة عبد الرحمن بن عوف الابتدائية",
          },
          image: post.featuredImage
            ? post.featuredImage.url.startsWith("http")
              ? post.featuredImage.url
              : `${siteUrl}${post.featuredImage.url}`
            : undefined,
        };

        return (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            <PostPage post={post} />
          </>
        );
      }
    }
  }

  notFound();
}
