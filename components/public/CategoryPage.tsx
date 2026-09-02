import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PostStatus, type Category } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar } from "lucide-react";

async function getCategoryData(category: Category) {
  const [children, posts, parentChain] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: category.id, isVisible: true },
      orderBy: { sortOrder: "asc" },
      include: { image: { select: { url: true, alt: true } } },
    }),
    prisma.post.findMany({
      where: { categoryId: category.id, status: PostStatus.PUBLISHED },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      include: { featuredImage: { select: { url: true, alt: true } } },
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
  if (category.parentId) {
    return getParentChain(category.parentId, chain);
  }
  return chain;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export async function CategoryPage({ category }: { category: Category & { image: { url: string; alt: string | null } | null } }) {
  const { children, posts, parentChain } = await getCategoryData(category);

  return (
    <div className="container mx-auto px-4 py-12 lg:px-8">
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

      <div className="mb-10 text-center sm:text-right">
        {category.image ? (
          <div className="relative mx-auto sm:mr-0 mb-4 aspect-[2/1] w-full max-w-2xl overflow-hidden rounded-2xl">
            <Image src={category.image.url} alt={category.image.alt ?? category.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{category.title}</h1>
        {category.description ? <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{category.description}</p> : null}
      </div>

      {children.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">الأقسام الفرعية</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {children.map((child) => (
              <Link key={child.id} href={`/${child.slug}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  {child.image ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image src={child.image.url} alt={child.image.alt ?? child.title} fill className="object-cover" sizes="25vw" />
                    </div>
                  ) : null}
                  <CardHeader>
                    <h3 className="text-lg font-semibold">{child.title}</h3>
                    {child.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{child.description}</p> : null}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">المحتوى</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/${category.slug}/${post.slug}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  {post.featuredImage ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image src={post.featuredImage.url} alt={post.featuredImage.alt ?? post.title} fill className="object-cover" sizes="33vw" />
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
            ))}
          </div>
        </section>
      )}

      {children.length === 0 && posts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">لا يوجد محتوى منشور في هذا القسم حالياً.</p>
        </div>
      )}
    </div>
  );
}
