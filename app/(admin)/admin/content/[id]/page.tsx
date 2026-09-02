import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePost, deletePost } from "../actions";
import { ContentForm } from "@/components/admin/ContentForm";
import { ArrowRight } from "lucide-react";
import { DeleteConfirmButton } from "@/components/admin/DeleteConfirmButton";

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
  const deleteBound = deletePost.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            العودة للمحتوى
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">تعديل: {post.title}</h1>
        </div>
        <DeleteConfirmButton
          action={deleteBound}
          label="حذف"
          title="تأكيد حذف المحتوى"
          message={`هل أنت متأكد من حذف "${post.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        />
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
