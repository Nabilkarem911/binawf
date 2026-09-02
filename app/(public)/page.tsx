import { HomepageSectionRenderer } from "@/components/public/HomeSections";
import { getSiteSettings } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return {
    title: settings.title,
    description: settings.description,
  };
}

export default async function HomePage() {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    prisma.homepageSection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <HomepageSectionRenderer key={section.id} section={section} settings={settings} />
      ))}
    </div>
  );
}
