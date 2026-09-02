"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, ChevronDown, Palette } from "lucide-react";

type NavChild = { id: string; title: string; url: string };
type NavItem = { id: string; title: string; url: string; children: NavChild[] };

export function MobileNav({
  nav,
  settings,
}: {
  nav: NavItem[];
  settings: { title: string; subtitle: string };
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggleGroup(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-secondary lg:hidden"
        aria-label="فتح القائمة"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-background shadow-navy animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-gradient text-gold">
                  <Palette className="h-5 w-5" />
                </span>
                <span className="font-extrabold text-foreground">{settings.title}</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-secondary"
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-border">
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground"
              >
                <Search className="h-4 w-4" />
                بحث في الموقع...
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="تنقل الهاتف">
              {nav.map((item) => (
                <div key={item.id} className="mb-1">
                  {item.children.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                        aria-expanded={expanded === item.id}
                      >
                        {item.title}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${expanded === item.id ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expanded === item.id && (
                        <div className="mr-3 border-r-2 border-border/60 pr-1 pb-1">
                          <Link
                            href={item.url}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            عرض الكل
                          </Link>
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.url}
                              onClick={() => setOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm text-foreground/75 hover:bg-secondary hover:text-foreground"
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.url}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4">
              <p className="text-xs text-muted-foreground">{settings.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
