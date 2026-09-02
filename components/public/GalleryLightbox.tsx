"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

type GalleryImage = {
  url: string;
  alt: string;
  caption: string | null;
};

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
  }, [images.length]);
  const prev = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + images.length) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, next, prev]);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:shadow-card-hover"
            aria-label={`فتح الصورة: ${img.alt}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition-all duration-300 group-hover:bg-navy/30 group-hover:opacity-100">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>
            {img.caption ? (
              <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-navy/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs text-white line-clamp-1">{img.caption}</p>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/95 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="عارض الصور"
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute left-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="إغلاق"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-8"
                aria-label="السابق"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-8"
                aria-label="التالي"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative mx-auto flex max-h-[85vh] max-w-5xl flex-col items-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex max-h-[75vh] items-center justify-center">
              <Image
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].alt}
                width={1200}
                height={800}
                className="max-h-[75vh] w-auto rounded-2xl object-contain"
                sizes="100vw"
              />
            </div>
            {images[lightboxIndex].caption ? (
              <p className="mt-4 text-center text-sm text-white/80">{images[lightboxIndex].caption}</p>
            ) : null}
            <p className="mt-2 text-xs text-white/50">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
