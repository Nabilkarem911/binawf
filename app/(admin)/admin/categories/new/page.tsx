import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostType } from "@prisma/client";
import { createCategory } from "../actions";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requireAuth();
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/categories" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة للأقسام
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">إنشاء قسم جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">أضف قسماً جديداً لتنظيم محتوى الموقع</p>
      </div>
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
