import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NavigationTree } from "@/components/admin/NavigationTree";

export const dynamic = "force-dynamic";

type NavItem = {
  id: string;
  title: string;
  url: string;
  isVisible: boolean;
  sortOrder: number;
  children: NavItem[];
};

export default async function NavigationPage() {
  await requireAuth();
  const navItems = await prisma.navigationItem.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });

  const mapItems = (items: typeof navItems): NavItem[] =>
    items.map((i) => ({
      id: i.id,
      title: i.title,
      url: i.url,
      isVisible: i.isVisible,
      sortOrder: i.sortOrder,
      children: i.children.map((c) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        isVisible: c.isVisible,
        sortOrder: c.sortOrder,
        children: [],
      })),
    }));

  const headerItems = mapItems(navItems.filter((i) => i.location === "HEADER"));
  const footerItems = mapItems(navItems.filter((i) => i.location === "FOOTER"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">القوائم</h1>
          <p className="mt-1 text-sm text-muted-foreground">إدارة عناصر القائمة في الترويسة والتذييل</p>
        </div>
        <Link
          href="/admin/navigation/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          عنصر جديد
        </Link>
      </div>

      <Tabs defaultValue="HEADER">
        <TabsList>
          <TabsTrigger value="HEADER">الترويسة</TabsTrigger>
          <TabsTrigger value="FOOTER">التذييل</TabsTrigger>
        </TabsList>
        <TabsContent value="HEADER" className="mt-4">
          <NavigationTree items={headerItems} />
        </TabsContent>
        <TabsContent value="FOOTER" className="mt-4">
          <NavigationTree items={footerItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
