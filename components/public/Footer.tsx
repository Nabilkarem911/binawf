import Link from "next/link";
import { getSiteSettings, getHeaderNavigation } from "@/lib/site";
import { Palette, Mail, MapPin } from "lucide-react";

export async function Footer() {
  const [settings, nav] = await Promise.all([getSiteSettings(), getHeaderNavigation()]);

  // Group nav items for footer columns
  const grouped = nav.filter((item) => item.children.length > 0).slice(0, 3);
  const standalone = nav.filter((item) => item.children.length === 0);

  return (
    <footer className="mt-auto w-full bg-navy text-navy-foreground">
      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-gold">
                <Palette className="h-6 w-6" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-white">{settings.title}</p>
                <p className="text-xs text-white/60">{settings.subtitle}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
              {settings.description || "بوابة التربية الفنية في مدرسة عبد الرحمن بن عوف الابتدائية بجدة."}
            </p>
            {settings.contactEmail ? (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light"
              >
                <Mail className="h-4 w-4" />
                {settings.contactEmail}
              </a>
            ) : null}
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/60">
              <MapPin className="h-4 w-4" />
              جدة، المملكة العربية السعودية
            </p>
          </div>

          {/* Navigation columns */}
          {grouped.map((group) => (
            <div key={group.id} className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold text-gold">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.url}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {child.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick links */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-bold text-gold">روابط سريعة</h3>
            <ul className="space-y-2.5">
              {standalone.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.url}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-white/50">
            {new Date().getFullYear()} © {settings.title} — جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-white/40">
            {settings.footerText || "موقع مدرسة عبد الرحمن بن عوف الابتدائية بجدة"}
          </p>
        </div>
      </div>
    </footer>
  );
}
