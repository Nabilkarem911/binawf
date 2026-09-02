import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePost } from "../actions";
import { ContentForm } from "@/components/admin/ContentForm";
import { Button } from "@/components/ui/button";
import { deletePost } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: { category: { select: { id: true, title: true } } },
    }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!post) notFound();

  const updateBound = updatePost.bind(null, id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تعديل محتوى</h1>
        <form action={deletePost.bind(null, id)}>
          <Button type="submit" variant="destructive" size="sm">
            حذف
          </Button>
        </form>
      </div>
      <ContentForm
        categories={categories}
        action={updateBound}
        post={{
          ...post,
          categoryId: post.category?.id ?? null,
        }}
      />
    </div>
  );
}
