import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesListPage() {
  await requireAuth();
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { parent: { select: { title: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الأقسام</h1>
        <Link href="/admin/categories/new">
          <Button className="gap-1">
            <Plus className="h-4 w-4" /> قسم جديد
          </Button>
        </Link>
      </div>

      <div className="rounded-xl bg-background ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>المعرف</TableHead>
              <TableHead>الأب</TableHead>
              <TableHead>الترتيب</TableHead>
              <TableHead>مرئي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <Link href={`/admin/categories/${cat.id}`} className="font-medium text-primary hover:underline">
                    {cat.title}
                  </Link>
                </TableCell>
                <TableCell dir="ltr">{cat.slug}</TableCell>
                <TableCell>{cat.parent?.title ?? "—"}</TableCell>
                <TableCell>{cat.sortOrder}</TableCell>
                <TableCell>{cat.isVisible ? "نعم" : "لا"}</TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  لا توجد أقسام.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
