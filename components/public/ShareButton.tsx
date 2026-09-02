"use client";

import { Share2 } from "lucide-react";

export function ShareButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-primary hover:text-accent"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.share) {
          navigator.share({ title: document.title, url: window.location.href });
        }
      }}
    >
      <Share2 className="h-4 w-4" />
      مشاركة
    </button>
  );
}
