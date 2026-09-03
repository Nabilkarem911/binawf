import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNavigationItem } from "../actions";
import { NavigationForm } from "@/components/admin/NavigationForm";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewNavigationPage() {
  await requireAuth();
  const parentItems = await prisma.navigationItem.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/navigation" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة للقوائم
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">إنشاء عنصر قائمة جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">أضف عنصراً جديداً إلى الترويسة أو التذييل</p>
      </div>
      <NavigationForm
        parentItems={parentItems}
        action={createNavigationItem}
        item={{
          title: "",
          url: "",
          target: null,
          icon: null,
          parentId: null,
          sortOrder: 0,
          isVisible: true,
          location: "HEADER",
        }}
      />
    </div>
  );
}
