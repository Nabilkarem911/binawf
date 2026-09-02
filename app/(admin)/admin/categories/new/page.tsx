import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostType } from "@prisma/client";
import { createCategory } from "../actions";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requireAuth();
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إنشاء قسم جديد</h1>
      <CategoryForm
        categories={categories}
        action={createCategory}
        category={{
          title: "",
          slug: "",
          description: "",
          contentType: PostType.ARTICLE,
          parentId: null,
          sortOrder: 0,
          isVisible: true,
          showInMenu: true,
        }}
      />
    </div>
  );
}
