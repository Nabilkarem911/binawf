import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostType, PostStatus } from "@prisma/client";
import { createPost } from "../actions";
import { ContentForm } from "@/components/admin/ContentForm";

export const dynamic = "force-dynamic";

export default async function NewContentPage() {
  await requireAuth();
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إنشاء محتوى جديد</h1>
      <ContentForm
        categories={categories}
        action={createPost}
        post={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          type: PostType.ARTICLE,
          status: PostStatus.DRAFT,
          categoryId: null,
          metaTitle: "",
          metaDescription: "",
          keywords: "",
          isFeatured: false,
        }}
      />
    </div>
  );
}
