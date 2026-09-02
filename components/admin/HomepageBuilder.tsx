"use client";

import { useState, useActionState } from "react";
import { Eye, EyeOff, GripVertical, Save, ArrowUp, ArrowDown } from "lucide-react";
import { toggleHomepageSection, reorderHomepageSections, updateHomepageSectionTitle } from "@/app/(admin)/admin/homepage/actions";

type Section = {
  id: string;
  title: string;
  subtitle: string | null;
  type: string;
  isVisible: boolean;
  sortOrder: number;
};

const typeLabel: Record<string, string> = {
  HERO: "ترويسة",
  FEATURED_CATEGORIES: "أقسام مميزة",
  LATEST_NEWS: "أحدث الأخبار",
  ANNOUNCEMENTS: "إعلانات",
  GALLERIES: "معارض",
  STUDENT_WORK: "إبداعات الطلاب",
  ACHIEVEMENTS: "إنجازات",
  VIDEOS: "فيديوهات",
  CUSTOM: "مخصص",
};

export function HomepageBuilder({ sections }: { sections: Section[] }) {
  const [items, setItems] = useState(sections);
  const [, toggleAction] = useActionState(toggleHomepageSection, { ok: true });
  const [, reorderAction] = useActionState(reorderHomepageSections, { ok: true });
  const [, titleAction] = useActionState(updateHomepageSectionTitle, { ok: true });

  function move(index: number, dir: "up" | "down") {
    const newItems = [...items];
    const swapIndex = dir === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);

    const formData = new FormData();
    formData.set("ids", newItems.map((i) => i.id).join(","));
    reorderAction(formData);
  }

  function toggle(id: string, current: boolean) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("isVisible", (!current).toString());
    toggleAction(formData);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isVisible: !current } : i)));
  }

  return (
    <div className="space-y-3">
      {items.map((section, index) => (
        <div
          key={section.id}
          className={`rounded-2xl border bg-card p-5 transition-all ${
            section.isVisible ? "border-border/60 shadow-card" : "border-dashed border-border opacity-60"
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Drag handle + order controls */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <GripVertical className="h-5 w-5 text-muted-foreground/30" />
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, "up")}
                  disabled={index === 0}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                  aria-label="تحريك لأعلى"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, "down")}
                  disabled={index === items.length - 1}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                  aria-label="تحريك لأسفل"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
                    {typeLabel[section.type] ?? section.type}
                  </span>
                  <span className="text-xs text-muted-foreground">ترتيب: {index + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(section.id, section.isVisible)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    section.isVisible
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {section.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {section.isVisible ? "ظاهر" : "مخفي"}
                </button>
              </div>

              {/* Editable title */}
              <form action={titleAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <input type="hidden" name="id" value={section.id} />
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">العنوان</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={section.title}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">العنوان الفرعي</label>
                  <input
                    type="text"
                    name="subtitle"
                    defaultValue={section.subtitle || ""}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70"
                >
                  <Save className="h-3.5 w-3.5" />
                  حفظ
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
