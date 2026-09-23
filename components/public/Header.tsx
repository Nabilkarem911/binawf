import Link from "next/link";
import { getHeaderNavigation, getSiteSettings } from "@/lib/site";
import { Search, Palette } from "lucide-react";
import { MobileNav } from "@/components/public/MobileNav";
import { DesktopNav } from "@/components/public/DesktopNav";

export async function Header() {
  const [nav, settings] = await Promise.all([getHeaderNavigation(), getSiteSettings()]);

  return (
    <header className="header-scroll sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-14 items-center justify-between gap-3 lg:h-16">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="bg-navy-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gold shadow-sm lg:h-10 lg:w-10">
            <Palette className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-display truncate text-base font-extrabold leading-tight text-foreground lg:text-lg">
              {settings.title}
            </span>
            {settings.subtitle ? (
              <span className="hidden truncate text-[11px] leading-tight text-muted-foreground sm:block">{settings.subtitle}</span>
            ) : null}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <DesktopNav nav={nav} />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Search pill — wide screens */}
          <Link
            href="/search"
            className="hidden h-9 items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-4 text-sm text-muted-foreground transition-all hover:border-gold/50 hover:text-foreground xl:inline-flex"
          >
            <Search className="h-4 w-4" />
            ابحث في الموقع...
          </Link>
          {/* Search icon — narrower screens */}
          <Link
            href="/search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground xl:hidden"
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
