import Link from "next/link";
import { getHeaderNavigation, getSiteSettings } from "@/lib/site";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export async function Header() {
  const [nav, settings] = await Promise.all([getHeaderNavigation(), getSiteSettings()]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex flex-col items-start gap-0.5">
          <span className="text-lg font-bold leading-none text-primary">{settings.title}</span>
          {settings.subtitle ? <span className="text-[10px] text-muted-foreground">{settings.subtitle}</span> : null}
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((item) => (
            <div key={item.id} className="group relative">
              <Link
                href={item.url}
                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                target={item.target || undefined}
              >
                {item.title}
              </Link>
              {item.children.length > 0 && (
                <div className="invisible absolute right-0 top-full w-56 opacity-0 group-hover:visible group-hover:opacity-100 transition-all bg-background border border-border rounded-md shadow-lg p-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.url}
                      className="block rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                      target={child.target || undefined}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/80 hover:bg-accent"
            aria-label="البحث"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Sheet>
            <SheetTrigger
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/80 hover:bg-accent"
              aria-label="القائمة"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-2 py-6">
                <span className="px-2 text-lg font-bold">{settings.title}</span>
                {nav.map((item) => (
                  <div key={item.id}>
                    <Link
                      href={item.url}
                      className="block rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-accent"
                    >
                      {item.title}
                    </Link>
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url}
                        className="block rounded-md px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
