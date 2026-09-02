import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategory, deleteCategory } from "../actions";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const [category, categories] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!category) notFound();

  const updateBound = updateCategory.bind(null, id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تعديل قسم</h1>
        <form action={deleteCategory.bind(null, id)}>
          <Button type="submit" variant="destructive" size="sm">
            حذف
          </Button>
        </form>
      </div>
      <CategoryForm categories={categories.filter((c) => c.id !== id)} action={updateBound} category={category} />
    </div>
  );
}
