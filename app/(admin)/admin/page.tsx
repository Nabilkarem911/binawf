import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderTree, Image as ImageIcon, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAuth();

  const [postsCount, categoriesCount, mediaCount, publishedCount, draftCount] = await Promise.all([
    prisma.post.count(),
    prisma.category.count(),
    prisma.media.count(),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "DRAFT" } }),
  ]);

  const stats = [
    { title: "إجمالي المقالات", value: postsCount, icon: FileText },
    { title: "المنشور", value: publishedCount, icon: Layers },
    { title: "المسودات", value: draftCount, icon: FileText },
    { title: "الأقسام", value: categoriesCount, icon: FolderTree },
    { title: "الوسائط", value: mediaCount, icon: ImageIcon },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl bg-muted/30 p-6">
        <h2 className="mb-4 text-lg font-semibold">نظرة عامة</h2>
        <p className="text-muted-foreground">
          نظام إدارة محتوى موهبة فنان. يمكنك من هنا إدارة المقالات والأقسام والوسائط وإعدادات الموقع.
        </p>
      </div>
    </div>
  );
}
