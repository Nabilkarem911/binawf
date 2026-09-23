"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  function toggleGroup(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the drawer (close button)
    drawer?.querySelector<HTMLElement>("button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const focusables = Array.from(
        drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-secondary lg:hidden"
        aria-label="فتح القائمة"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portal escapes the header's backdrop-filter containing block so `fixed` is viewport-relative */}
      {open &&
        createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden lg:hidden">
          {/* Backdrop */}
          <div
            className="animate-in fade-in absolute inset-0 bg-navy/60 backdrop-blur-sm duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
            className="animate-in slide-in-from-right absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-background shadow-navy duration-300"
          >
            {/* Header — branded gradient */}
            <div className="gradient-mesh grain relative px-5 py-5">
              <div className="relative z-10 flex items-center justify-between">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                  <span className="glass flex h-10 w-10 items-center justify-center rounded-xl text-gold">
                    <Palette className="h-5 w-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-display font-extrabold text-white">{settings.title}</span>
                    {settings.subtitle ? (
                      <span className="text-[11px] text-white/60">{settings.subtitle}</span>
                    ) : null}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="glass inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-border px-4 py-3">
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
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
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                        aria-expanded={expanded === item.id}
                      >
                        {item.title}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${expanded === item.id ? "rotate-180 text-gold" : ""}`}
                        />
                      </button>
                      {expanded === item.id && (
                        <div className="animate-in fade-in slide-in-from-top-1 ms-3 border-s-2 border-gold/30 pb-1 ps-1 duration-200">
                          <Link
                            href={item.url}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            عرض الكل
                          </Link>
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.url}
                              onClick={() => setOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
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
                      className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="bg-gold-gradient inline-block h-2 w-2 rounded-full" />
                {settings.subtitle || "موهبة فنان — التربية الفنية"}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
