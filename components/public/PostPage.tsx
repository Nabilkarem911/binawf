import Link from "next/link";
import Image from "next/image";
import { formatHijriDate } from "@/lib/site";
import type { Post } from "@prisma/client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar, User as UserIcon } from "lucide-react";

export async function PostPage({
  post,
}: {
  post: Post & {
    author: { name: string } | null;
    category: { title: string; slug: string } | null;
    featuredImage: { url: string; alt: string | null } | null;
  };
}) {
  return (
    <article className="container mx-auto px-4 py-12 lg:px-8">
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

      {post.featuredImage ? (
        <div className="relative mx-auto mb-8 aspect-[21/9] w-full max-w-4xl overflow-hidden rounded-2xl">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt ?? post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1200px) 100vw, 75vw"
          />
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{post.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.author ? (
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-4 w-4" /> {post.author.name}
            </span>
          ) : null}
          {post.publishedAt ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {formatHijriDate(post.publishedAt)}
            </span>
          ) : null}
        </div>

        {post.excerpt ? <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p> : null}

        {post.content ? (
          <div
            className="prose prose-stone mt-8 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : null}

        {post.category ? (
          <div className="mt-12 border-t border-border pt-6">
            <Link
              href={`/${post.category.slug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              العودة إلى {post.category.title}
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
