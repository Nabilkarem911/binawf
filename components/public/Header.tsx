import Link from "next/link";
import { getHeaderNavigation, getSiteSettings } from "@/lib/site";
import { Search, Palette } from "lucide-react";
import { MobileNav } from "@/components/public/MobileNav";

export async function Header() {
  const [nav, settings] = await Promise.all([getHeaderNavigation(), getSiteSettings()]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-gradient text-gold shadow-sm lg:h-11 lg:w-11">
            <Palette className="h-5 w-5 lg:h-6 lg:w-6" />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-extrabold leading-tight text-foreground lg:text-lg">
              {settings.title}
            </span>
            {settings.subtitle ? (
              <span className="hidden text-[11px] leading-tight text-muted-foreground sm:block lg:text-xs">
                {settings.subtitle}
              </span>
            ) : null}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="التنقل الرئيسي">
          {nav.map((item) => (
            <div key={item.id} className="group relative">
              <Link
                href={item.url}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
                target={item.target || undefined}
              >
                {item.title}
                {item.children.length > 0 && (
                  <svg className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                )}
              </Link>
              {item.children.length > 0 && (
                <div className="invisible absolute right-0 top-full z-50 w-64 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-popover p-2 shadow-card-hover">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url}
                        className="block rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                        target={child.target || undefined}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="البحث"
          >
            <Search className="h-5 w-5" />
          </Link>
          <MobileNav nav={nav} settings={settings} />
        </div>
      </div>
    </header>
  );
}
