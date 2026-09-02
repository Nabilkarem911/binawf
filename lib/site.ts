import { prisma } from "./prisma";

export async function getSiteSettings() {
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
}

export async function getHeaderNavigation() {
  return prisma.navigationItem.findMany({
    where: { location: "HEADER", isVisible: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export function formatHijriDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
