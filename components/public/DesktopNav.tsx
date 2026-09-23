"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type NavChild = { id: string; title: string; url: string; target?: string | null };
type NavItem = NavChild & { children: NavChild[] };

const MAX_VISIBLE = 5;

/** Closes a menu on Escape and restores focus to its trigger. */
function useMenuA11y(open: boolean, setOpen: (v: boolean) => void, ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLElement>("a, button")?.focus();
      }
    }
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, setOpen, ref]);
}

const linkClass =
  "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground focus-visible:bg-secondary focus-visible:text-foreground";

const dropdownClass = (open: boolean) =>
  `absolute right-0 top-full z-50 w-64 pt-2 transition-all duration-200 ${
    open ? "visible opacity-100 translate-y-0" : "invisible -translate-y-1 opacity-0"
  }`;

const dropdownInnerClass = "overflow-hidden rounded-2xl border border-border/60 bg-popover p-2 shadow-card-hover";

const childLinkClass =
  "block rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground focus-visible:bg-secondary focus-visible:text-foreground";

function NavMenuItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasChildren = item.children.length > 0;
  useMenuA11y(open, setOpen, ref);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Link
        href={item.url}
        target={item.target || undefined}
        className={linkClass}
        aria-haspopup={hasChildren ? "true" : undefined}
        aria-expanded={hasChildren ? open : undefined}
      >
        {item.title}
        {hasChildren ? (
          <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
        ) : null}
      </Link>
      {hasChildren ? (
        <div className={dropdownClass(open)}>
          <div className={dropdownInnerClass}>
            {item.children.map((child) => (
              <Link key={child.id} href={child.url} target={child.target || undefined} className={childLinkClass}>
                {child.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MoreMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useMenuA11y(open, setOpen, ref);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button type="button" className={linkClass} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(true)}>
        المزيد
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={dropdownClass(open)}>
        <div className={`${dropdownInnerClass} max-h-[70vh] overflow-y-auto`}>
          {items.map((item) =>
            item.children.length > 0 ? (
              <div key={item.id} className="mb-1 last:mb-0">
                <Link href={item.url} target={item.target || undefined} className={`${childLinkClass} font-semibold text-foreground`}>
                  {item.title}
                </Link>
                <div className="ms-3 border-s-2 border-border/50 ps-1">
                  {item.children.map((child) => (
                    <Link key={child.id} href={child.url} target={child.target || undefined} className={childLinkClass}>
                      {child.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={item.id} href={item.url} target={item.target || undefined} className={childLinkClass}>
                {item.title}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function DesktopNav({ nav }: { nav: NavItem[] }) {
  const visible = nav.slice(0, MAX_VISIBLE);
  const overflow = nav.slice(MAX_VISIBLE);
  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="التنقل الرئيسي">
      {visible.map((item) => (
        <NavMenuItem key={item.id} item={item} />
      ))}
      {overflow.length > 0 ? <MoreMenu items={overflow} /> : null}
    </nav>
  );
}
