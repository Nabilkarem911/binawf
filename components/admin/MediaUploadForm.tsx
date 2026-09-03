"use client";

import { useState, FormEvent, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Search, Trash2, Copy, Check, Image as ImageIcon, FileText, Film, X, Pencil } from "lucide-react";
import type { Media } from "@prisma/client";

type UploadStatus = "pending" | "uploading" | "success" | "error";

type UploadItem = {
  file: File;
  status: UploadStatus;
  error?: string;
  progress?: number;
};

function getMediaUrl(m: Media): string {
  return m.url.startsWith("/uploads/") ? `/api/media?filename=${m.filename}` : m.url;
}

export function MediaUploadForm({ media }: { media: Media[] }) {
  const router = useRouter();
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editMedia, setEditMedia] = useState<Media | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList) => {
    const items: UploadItem[] = Array.from(files).map((file) => ({
      file,
      status: "pending" as UploadStatus,
    }));
    setUploadItems((prev) => [...prev, ...items]);

    // Upload each file sequentially
    (async () => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setUploadItems((prev) =>
          prev.map((p, idx) =>
            idx === uploadItemsIndex(prev, item.file.name, i)
              ? { ...p, status: "uploading" as UploadStatus }
              : p
          )
        );
        try {
          const formData = new FormData();
          formData.append("file", item.file);
          const res = await fetch("/api/media", { method: "POST", body: formData });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "فشل الرفع");
          }
          setUploadItems((prev) =>
            prev.map((p) =>
              p.file === item.file ? { ...p, status: "success" as UploadStatus } : p
            )
          );
        } catch (err) {
          setUploadItems((prev) =>
            prev.map((p) =>
              p.file === item.file
                ? { ...p, status: "error" as UploadStatus, error: err instanceof Error ? err.message : "خطأ" }
                : p
            )
          );
        }
      }
      // Refresh after all uploads
      router.refresh();
      // Clear completed items after a delay
      setTimeout(() => {
        setUploadItems((prev) => prev.filter((p) => p.status === "error" || p.status === "pending"));
      }, 2000);
    })();
  }, [router]);

  function uploadItemsIndex(arr: UploadItem[], name: string, fallback: number): number {
    const idx = arr.findIndex((p) => p.file.name === name);
    return idx >= 0 ? idx : fallback;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const input = fileInputRef.current;
    if (input && input.files && input.files.length > 0) {
      handleFiles(input.files);
      input.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function copyUrl(m: Media) {
    const url = getMediaUrl(m);
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/media?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function openEdit(m: Media) {
    setEditMedia(m);
    setEditAlt(m.alt || "");
    setEditCaption(m.caption || "");
  }

  async function saveEdit() {
    if (!editMedia) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/media?id=${editMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: editAlt, caption: editCaption }),
      });
      if (res.ok) {
        router.refresh();
        setEditMedia(null);
      }
    } catch {
      // ignore
    } finally {
      setSavingEdit(false);
    }
  }

  const filtered = media.filter((m) => {
    if (filter !== "ALL" && m.type !== filter) return false;
    if (search && !m.originalName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: media.length,
    images: media.filter((m) => m.type === "IMAGE").length,
    videos: media.filter((m) => m.type === "VIDEO_LINK").length,
    documents: media.filter((m) => m.type === "DOCUMENT").length,
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <form onSubmit={onSubmit}>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border bg-secondary/30 hover:border-accent hover:bg-secondary/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-semibold text-foreground">اسحب الملفات هنا أو انقر للاختيار</p>
            <p className="mt-1 text-xs text-muted-foreground">صور، فيديوهات، مستندات — حتى 25MB لكل ملف</p>
            <input
              ref={fileInputRef}
              id="files"
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </form>

        {/* Upload progress items */}
        {uploadItems.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadItems.map((item, i) => (
              <div
                key={`${item.file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/20 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {item.file.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : item.file.type.startsWith("video/") ? (
                    <Film className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(item.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <div className="shrink-0">
                  {item.status === "pending" && (
                    <span className="text-xs text-muted-foreground">في الانتظار</span>
                  )}
                  {item.status === "uploading" && (
                    <span className="text-xs text-accent">جاري الرفع...</span>
                  )}
                  {item.status === "success" && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {item.status === "error" && (
                    <div className="flex items-center gap-1">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-600">{item.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "الإجمالي", value: stats.total, icon: ImageIcon, color: "text-blue-600" },
          { label: "صور", value: stats.images, icon: ImageIcon, color: "text-green-600" },
          { label: "فيديو", value: stats.videos, icon: Film, color: "text-purple-600" },
          { label: "مستندات", value: stats.documents, icon: FileText, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <p className="mt-2 text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الوسائط..."
            className="h-10 w-full rounded-xl border border-border bg-background pr-10 pl-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex gap-1.5">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.v ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {media.length === 0 ? "لا توجد وسائط بعد" : "لا توجد نتائج مطابقة"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {media.length === 0 ? "ارفع أول ملف للبدء" : "جرّب تغيير البحث أو التصفية"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:shadow-card-hover"
            >
              {/* Preview */}
              <div className="relative aspect-square overflow-hidden bg-secondary">
                {m.type === "IMAGE" ? (
                  <Image
                    src={getMediaUrl(m)}
                    alt={m.alt || m.originalName}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="200px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {m.type === "VIDEO_LINK" ? (
                      <Film className="h-8 w-8 text-muted-foreground/40" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="truncate text-xs font-medium text-foreground" title={m.originalName}>
                  {m.originalName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {m.mimeType} • {(m.size / 1024).toFixed(0)} KB
                </p>
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-x-0 top-0 flex justify-between p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyUrl(m); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
                    title="نسخ الرابط"
                  >
                    {copiedId === m.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
                    title="تحرير"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(m.id); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-sm transition-colors hover:bg-white"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-navy animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">تأكيد الحذف</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              هل أنت متأكد من حذف هذه الوسائط؟ سيتم إزالة الملف نهائياً.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                {deleting ? "جاري الحذف..." : "نعم، احذف"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {editMedia && (
        <Dialog open={true} onOpenChange={(o) => !o && setEditMedia(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>تحرير الوسائط</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editMedia.type === "IMAGE" && (
                <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                  <Image
                    src={getMediaUrl(editMedia)}
                    alt={editAlt || editMedia.originalName}
                    fill
                    className="object-contain"
                    unoptimized
                    sizes="400px"
                  />
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">{editMedia.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {editMedia.mimeType} • {(editMedia.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-alt">النص البديل (Alt Text)</Label>
                <Input
                  id="edit-alt"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="وصف الصورة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-caption">التعليق (Caption)</Label>
                <Textarea
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={2}
                  placeholder="تعليق اختياري"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={saveEdit} disabled={savingEdit} className="flex-1">
                  {savingEdit ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditMedia(null)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
