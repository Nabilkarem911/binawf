import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateNavigationItem, deleteNavigationItem } from "../actions";
import { NavigationForm } from "@/components/admin/NavigationForm";
import { DeleteConfirmButton } from "@/components/admin/DeleteConfirmButton";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditNavigationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const [item, parentItems] = await Promise.all([
    prisma.navigationItem.findUnique({ where: { id } }),
    prisma.navigationItem.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!item) notFound();

  const updateBound = updateNavigationItem.bind(null, id);
  const deleteBound = deleteNavigationItem.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/navigation" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            العودة للقوائم
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">تعديل: {item.title}</h1>
        </div>
        <DeleteConfirmButton
          action={deleteBound}
          label="حذف"
          title="تأكيد حذف عنصر القائمة"
          message={`هل أنت متأكد من حذف "${item.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        />
      </div>
      <NavigationForm
        parentItems={parentItems}
        action={updateBound}
        item={{
          id: item.id,
          title: item.title,
          url: item.url,
          target: item.target,
          icon: item.icon,
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          isVisible: item.isVisible,
          location: item.location,
        }}
      />
    </div>
  );
}
