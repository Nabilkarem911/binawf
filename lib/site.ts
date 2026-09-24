import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// Public data fetches are cached across requests and tagged "public" —
// every CMS mutation calls revalidatePublic() (lib/cache.ts) to bust them.
// revalidate: 3600 is a backstop in case a write path misses invalidation.
// NOTE: unstable_cache JSON-serializes results — selects must exclude
// Date columns (they'd return as strings after a cache hit).

export const getSiteSettings = unstable_cache(
  async () => {
    const rows = await prisma.siteSetting.findMany({
      where: { isPublic: true },
    });
    const settings = new Map<string, string>();
    for (const row of rows) {
      settings.set(row.key, row.value);
    }
    return {
      title: settings.get("site_title") ?? "موهبة فنان",
      subtitle: settings.get("site_subtitle") ?? "",
      description: settings.get("site_description") ?? "",
      contactEmail: settings.get("contact_email") ?? "",
      footerText: settings.get("footer_text") ?? "",
    };
  },
  ["site-settings"],
  { tags: ["public"], revalidate: 3600 }
);

export const getHeaderNavigation = unstable_cache(
  async () =>
    prisma.navigationItem.findMany({
      where: { location: "HEADER", isVisible: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        url: true,
        target: true,
        children: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, url: true, target: true },
        },
      },
    }),
  ["header-nav"],
  { tags: ["public"], revalidate: 3600 }
);

export const getHomepageSections = unstable_cache(
  async () =>
    prisma.homepageSection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        subtitle: true,
        settings: true,
        sortOrder: true,
      },
    }),
  ["homepage-sections"],
  { tags: ["public"], revalidate: 3600 }
);

export function formatHijriDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
