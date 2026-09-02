import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, FolderTree, ArrowLeft, Image as ImageIcon, SearchX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  if (!q || q.trim().length === 0) {
    return (
      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-gradient text-gold">
            <Search className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">ابحث في الموقع</h1>
          <p className="mt-3 text-muted-foreground">ابحث عن المقالات والأخبار والأقسام والمعارض وإبداعات الطلاب</p>
          <form method="GET" className="mx-auto mt-8 flex max-w-xl gap-2">
            <Input
              name="q"
              placeholder="اكتب كلمة البحث..."
              className="h-12 rounded-xl text-base"
              autoFocus
            />
            <Button type="submit" size="icon" className="h-12 w-12 shrink-0 rounded-xl">
              <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>
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
      include: {
        category: { select: { title: true, slug: true } },
        featuredImage: { select: { url: true, alt: true } },
      },
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
      include: { image: { select: { url: true, alt: true } } },
    }),
  ]);

  const totalResults = posts.length + categories.length;

  return (
    <div className="container-page py-8 lg:py-12">
      <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">نتائج البحث</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {totalResults > 0
          ? `${totalResults} نتيجة لـ "${term}"`
          : `لا توجد نتائج لـ "${term}"`}
      </p>

      <form method="GET" className="mt-6 flex max-w-xl gap-2">
        <Input name="q" defaultValue={term} placeholder="ابحث في الموقع..." className="h-12 rounded-xl text-base" />
        <Button type="submit" size="icon" className="h-12 w-12 shrink-0 rounded-xl">
          <Search className="h-5 w-5" />
        </Button>
      </form>

      {totalResults === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <SearchX className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-sm text-muted-foreground">جرّب كلمات أخرى أو تصفح الأقسام من القائمة الرئيسية</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent">
            العودة للرئيسية
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {/* Posts */}
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
              <Calendar className="h-5 w-5 text-accent" />
              المقالات والأخبار
              {posts.length > 0 && <span className="text-sm font-normal text-muted-foreground">({posts.length})</span>}
            </h2>
            {posts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                لا توجد نتائج في المقالات
              </p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.category?.slug ?? "articles"}/${post.slug}`}
                    className="group flex gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:shadow-card-hover"
                  >
                    {post.featuredImage ? (
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt ?? post.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {post.category ? (
                        <span className="text-xs font-semibold text-accent">{post.category.title}</span>
                      ) : null}
                      <p className="font-bold text-foreground line-clamp-1 group-hover:text-primary">{post.title}</p>
                      {post.excerpt ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Categories */}
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
              <FolderTree className="h-5 w-5 text-accent" />
              الأقسام
              {categories.length > 0 && <span className="text-sm font-normal text-muted-foreground">({categories.length})</span>}
            </h2>
            {categories.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                لا توجد نتائج في الأقسام
              </p>
            ) : (
              <div className="space-y-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/${cat.slug}`}
                    className="group flex gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:shadow-card-hover"
                  >
                    {cat.image ? (
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={cat.image.url}
                          alt={cat.image.alt ?? cat.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <FolderTree className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground line-clamp-1 group-hover:text-primary">{cat.title}</p>
                      {cat.description ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
