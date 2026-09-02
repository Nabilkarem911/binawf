import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  if (!q || q.trim().length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center lg:px-8">
        <h1 className="text-3xl font-bold">البحث</h1>
        <form method="GET" className="mx-auto mt-8 flex max-w-xl gap-2">
          <Input name="q" placeholder="ابحث في المقالات والأقسام..." className="h-12" />
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>
    );
  }

  const term = q.trim();

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { excerpt: { contains: term, mode: "insensitive" } },
          { content: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
      include: { category: { select: { title: true, slug: true } } },
    }),
    prisma.category.findMany({
      where: {
        isVisible: true,
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-12 lg:px-8">
      <h1 className="text-3xl font-bold">نتائج البحث</h1>
      <form method="GET" className="mt-4 flex max-w-xl gap-2">
        <Input name="q" defaultValue={term} placeholder="ابحث في المقالات والأقسام..." className="h-12" />
        <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
          <Search className="h-5 w-5" />
        </Button>
      </form>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-semibold">المقالات والأخبار</h2>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">لا توجد نتائج في المقالات.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/${post.category?.slug ?? "articles"}/${post.slug}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="py-4">
                      <p className="font-semibold">{post.title}</p>
                      {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p> : null}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">الأقسام</h2>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">لا توجد نتائج في الأقسام.</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/${cat.slug}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="py-4">
                      <p className="font-semibold">{cat.title}</p>
                      {cat.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p> : null}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
