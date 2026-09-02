import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { CategoryPage } from "@/components/public/CategoryPage";
import { PostPage } from "@/components/public/PostPage";

export const dynamic = "force-dynamic";

type PageParams = {
  slug: string[];
};

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const lastSlug = slug[slug.length - 1];

  const category = await prisma.category.findUnique({ where: { slug: lastSlug } });
  if (category) {
    return {
      title: category.title,
      description: category.description || category.title,
    };
  }

  if (slug.length >= 2) {
    const parentSlug = slug[slug.length - 2];
    const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
    if (parent) {
      const post = await prisma.post.findUnique({
        where: { slug_categoryId: { slug: lastSlug, categoryId: parent.id } },
      });
      if (post) {
        return {
          title: post.metaTitle || post.title,
          description: post.metaDescription || post.excerpt || post.title,
        };
      }
    }
  }

  return { title: "الصفحة غير موجودة" };
}

export default async function DynamicPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const lastSlug = slug[slug.length - 1];

  const category = await prisma.category.findUnique({
    where: { slug: lastSlug },
    include: {
      image: { select: { url: true, alt: true } },
      parent: true,
    },
  });

  if (category) {
    return <CategoryPage category={category} />;
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
          featuredImage: { select: { url: true, alt: true } },
          media: { include: { media: { select: { url: true, alt: true, caption: true, width: true, height: true } } } },
        },
      });
      if (post && post.status === PostStatus.PUBLISHED) {
        return <PostPage post={post} />;
      }
    }
  }

  notFound();
}
