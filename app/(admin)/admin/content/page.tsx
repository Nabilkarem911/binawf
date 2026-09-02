import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PostStatus, PostType } from "@prisma/client";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PUBLISHED: "منشور",
  DRAFT: "مسودة",
  ARCHIVED: "مؤرشف",
};

const typeLabel: Record<string, string> = {
  PAGE: "صفحة",
  ARTICLE: "مقال",
  NEWS: "خبر",
  ANNOUNCEMENT: "إعلان",
  PROJECT: "مشروع",
  LESSON: "درس",
  RESEARCH: "بحث",
  AWARD: "جائزة",
  ACHIEVEMENT: "إنجاز",
  GALLERY: "معرض",
  EVENT: "فعالية",
  VIRTUAL_EXHIBITION: "معرض افتراضي",
};

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  await requireAuth();
  const { type, status } = await searchParams;

  const posts = await prisma.post.findMany({
    where: {
      ...(type ? { type: type as PostType } : {}),
      ...(status ? { status: status as PostStatus } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { category: { select: { title: true, slug: true } }, author: { select: { name: true } } },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">المحتوى</h1>
        <Link href="/admin/content/new">
          <Button className="gap-1">
            <Plus className="h-4 w-4" /> جديد
          </Button>
        </Link>
      </div>

      <div className="rounded-xl bg-background ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>القسم</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الكاتب</TableHead>
              <TableHead>آخر تحديث</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Link href={`/admin/content/${post.id}`} className="font-medium text-primary hover:underline">
                    {post.title}
                  </Link>
                </TableCell>
                <TableCell>{post.category?.title ?? "—"}</TableCell>
                <TableCell>{typeLabel[post.type] ?? post.type}</TableCell>
                <TableCell>
                  <Badge variant={post.status === PostStatus.PUBLISHED ? "default" : "secondary"}>
                    {statusLabel[post.status] ?? post.status}
                  </Badge>
                </TableCell>
                <TableCell>{post.author?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("ar-SA").format(post.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  لا يوجد محتوى.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
