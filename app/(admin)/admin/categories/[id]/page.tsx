import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategory, deleteCategory } from "../actions";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ArrowRight } from "lucide-react";
import { DeleteConfirmButton } from "@/components/admin/DeleteConfirmButton";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const [category, categories, media] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  if (!category) notFound();

  const updateBound = updateCategory.bind(null, id);
  const deleteBound = deleteCategory.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/categories" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            العودة للأقسام
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">تعديل: {category.title}</h1>
        </div>
        <DeleteConfirmButton
          action={deleteBound}
          label="حذف القسم"
          title="تأكيد حذف القسم"
          message={`هل أنت متأكد من حذف قسم "${category.title}"؟ سيتم حذف جميع الأقسام الفرعية المرتبطة به.`}
        />
      </div>
      <CategoryForm
        categories={categories.filter((c) => c.id !== id)}
        media={media}
        action={updateBound}
        category={{
          ...category,
          imageId: category.imageId,
        }}
      />
    </div>
  );
}
