import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostType, PostStatus } from "@prisma/client";
import { createPost } from "../actions";
import { ContentForm } from "@/components/admin/ContentForm";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewContentPage() {
  await requireAuth();
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة للمحتوى
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">إنشاء محتوى جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">أضف مقالاً أو خبراً أو إعلاناً أو أي نوع محتوى</p>
      </div>
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
