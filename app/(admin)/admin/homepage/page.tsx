import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HomepageBuilder } from "@/components/admin/HomepageBuilder";

export const dynamic = "force-dynamic";

export default async function HomepageBuilderPage() {
  await requireAuth();
  const sections = await prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">منشئ الصفحة الرئيسية</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تحكم في ترتيب وظهور أقسام الصفحة الرئيسية. التغييرات تظهر فوراً على الموقع.
        </p>
      </div>
      <HomepageBuilder sections={sections} />
    </div>
  );
}
