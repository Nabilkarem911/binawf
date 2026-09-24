import { HomepageSectionRenderer } from "@/components/public/HomeSections";
import { getSiteSettings, getHomepageSections } from "@/lib/site";

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
    getHomepageSections(),
  ]);

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <HomepageSectionRenderer key={section.id} section={section} settings={settings} />
      ))}
    </div>
  );
}
