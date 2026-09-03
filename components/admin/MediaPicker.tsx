"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Search, Image as ImageIcon, FileText, Film, X, Check, Link2 } from "lucide-react";
import type { Media } from "@prisma/client";

type MediaPickerProps = {
  media: Media[];
  selectedId: string | null;
  onSelect: (media: Media | null) => void;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  label?: string;
};

function getMediaUrl(m: Media): string {
  return m.url.startsWith("/uploads/") ? `/api/media?filename=${m.filename}` : m.url;
}

export function MediaPicker({
  media,
  selectedId,
  onSelect,
  altText = "",
  onAltTextChange,
  label = "الصورة الرئيسية",
}: MediaPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = media.find((m) => m.id === selectedId) || null;

  const filtered = media.filter((m) => {
    if (filter !== "ALL" && m.type !== filter) return false;
    if (search && !m.originalName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const uploaded: Media[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/media", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setUploadError(data.error || `فشل رفع: ${file.name}`);
          continue;
        }
        const data = await res.json();
        if (data.media) uploaded.push(data.media);
      }
      if (uploaded.length > 0) {
        setUploadSuccess(`تم رفع ${uploaded.length} ملف بنجاح`);
        router.refresh();
      }
    } catch {
      setUploadError("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
      <h3 className="mb-4 text-sm font-bold text-foreground">{label}</h3>

      {/* Preview or placeholder */}
      {selected ? (
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-secondary">
            {selected.type === "IMAGE" ? (
              <Image
                src={getMediaUrl(selected)}
                alt={selected.alt || selected.originalName}
                fill
                className="object-cover"
                unoptimized
                sizes="400px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {selected.type === "VIDEO_LINK" ? (
                  <Film className="h-10 w-10 text-muted-foreground/40" />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground" title={selected.originalName}>
            {selected.originalName}
          </p>

          {onAltTextChange !== undefined && (
            <div className="space-y-1.5">
              <Label htmlFor="alt-text" className="text-xs font-semibold text-muted-foreground">
                النص البديل (Alt Text)
              </Label>
              <Input
                id="alt-text"
                value={altText}
                onChange={(e) => onAltTextChange(e.target.value)}
                className="h-9 text-sm"
                placeholder="وصف الصورة لتحسين إتاحة الوصول"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={
                  <Button type="button" variant="outline" size="sm" className="flex-1">
                    <Link2 className="h-3.5 w-3.5" />
                    استبدال
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>اختيار من المكتبة</DialogTitle>
                </DialogHeader>
                <MediaPickerDialog
                  media={filtered}
                  onSelect={(m) => {
                    onSelect(m);
                    if (onAltTextChange && m.alt) onAltTextChange(m.alt);
                    setOpen(false);
                  }}
                  search={search}
                  setSearch={setSearch}
                  filter={filter}
                  setFilter={setFilter}
                  onUpload={handleUpload}
                  uploading={uploading}
                  uploadError={uploadError}
                  uploadSuccess={uploadSuccess}
                  fileInputRef={fileInputRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                />
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onSelect(null)}
            >
              <X className="h-3.5 w-3.5" />
              إزالة
            </Button>
          </div>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-4 py-8 text-center transition-colors hover:border-accent hover:bg-secondary/50"
          >
            <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">لا توجد صورة محددة</p>
            <p className="mt-1 text-xs text-muted-foreground">اختر من المكتبة أو ارفع صورة جديدة</p>
            <DialogTrigger
              render={
                <Button type="button" variant="outline" size="sm" className="mt-3">
                  <Upload className="h-3.5 w-3.5" />
                  اختيار صورة
                </Button>
              }
            />
          </div>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>اختيار من المكتبة</DialogTitle>
            </DialogHeader>
            <MediaPickerDialog
              media={filtered}
              onSelect={(m) => {
                onSelect(m);
                if (onAltTextChange && m.alt) onAltTextChange(m.alt);
                setOpen(false);
              }}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              onUpload={handleUpload}
              uploading={uploading}
              uploadError={uploadError}
              uploadSuccess={uploadSuccess}
              fileInputRef={fileInputRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MediaPickerDialog({
  media,
  onSelect,
  search,
  setSearch,
  filter,
  setFilter,
  onUpload,
  uploading,
  uploadError,
  uploadSuccess,
  fileInputRef,
  onDrop,
  onDragOver,
}: {
  media: Media[];
  onSelect: (m: Media) => void;
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (f: string) => void;
  onUpload: (files: FileList) => void;
  uploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="rounded-xl border-2 border-dashed border-border bg-secondary/20 px-4 py-4 text-center"
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          {uploading ? "جاري الرفع..." : "اسحب الملفات هنا أو"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          className="sr-only"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-1 text-xs font-semibold text-accent hover:underline"
          disabled={uploading}
        >
          اختر ملفات
        </button>
        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
        {uploadSuccess && <p className="mt-2 text-xs text-green-600">{uploadSuccess}</p>}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث..."
            className="h-9 w-full rounded-lg border border-border bg-background pr-9 pl-4 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-1">
          {[
            { v: "ALL", l: "الكل" },
            { v: "IMAGE", l: "صور" },
            { v: "VIDEO_LINK", l: "فيديو" },
            { v: "DOCUMENT", l: "مستندات" },
          ].map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setFilter(f.v)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                filter === f.v ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-h-[400px] overflow-y-auto">
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد وسائط</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {media.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                className="group relative overflow-hidden rounded-lg border border-border/60 bg-card transition-all hover:border-accent hover:shadow-card-hover"
              >
                <div className="relative aspect-square overflow-hidden bg-secondary">
                  {m.type === "IMAGE" ? (
                    <Image
                      src={getMediaUrl(m)}
                      alt={m.alt || m.originalName}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="150px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {m.type === "VIDEO_LINK" ? (
                        <Film className="h-6 w-6 text-muted-foreground/40" />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                  )}
                </div>
                <p className="truncate p-1.5 text-[10px] font-medium text-foreground" title={m.originalName}>
                  {m.originalName}
                </p>
                <div className="absolute inset-0 flex items-center justify-center bg-navy/0 transition-colors group-hover:bg-navy/20">
                  <Check className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
