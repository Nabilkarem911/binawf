import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import type { MetadataRoute } from "next";

// Sitemap must be generated at request time: it queries the DB, which is only
// reachable at runtime (no DATABASE_URL during `next build`).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [categories, posts] = await Promise.all([
    prisma.category.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      select: { slug: true, category: { select: { slug: true } }, updatedAt: true },
    }),
  ]);

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const postUrls = posts
    .filter((post) => post.category)
    .map((post) => ({
      url: `${baseUrl}/${post.category!.slug}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...categoryUrls,
    ...postUrls,
  ];
}
