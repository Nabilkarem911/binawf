"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Search, Trash2, Copy, Check, Image as ImageIcon, FileText, Film } from "lucide-react";
import type { Media } from "@prisma/client";

export function MediaUploadForm({ media }: { media: Media[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/media", { method: "POST", body: formData });
        if (!res.ok) {
          setMessage("فشل رفع بعض الملفات.");
        }
      }
      setMessage("تم رفع الملفات بنجاح.");
      formRef.current?.reset();
      setFiles(null);
      router.refresh();
    } catch {
      setMessage("حدث خطأ أثناء الرفع.");
    } finally {
      setUploading(false);
    }
  }

  async function copyUrl(m: Media) {
    const url = m.url.startsWith("/uploads/") ? `/api/media?filename=${m.filename}` : m.url;
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

  function getMediaUrl(m: Media) {
    return m.url.startsWith("/uploads/") ? `/api/media?filename=${m.filename}` : m.url;
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
        <form ref={formRef} onSubmit={onSubmit}>
          <label
            htmlFor="files"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center transition-colors hover:border-accent hover:bg-secondary/50 cursor-pointer"
          >
            <Upload className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-semibold text-foreground">اسحب الملفات هنا أو انقر للاختيار</p>
            <p className="mt-1 text-xs text-muted-foreground">صور، فيديوهات، مستندات — حتى 10MB لكل ملف</p>
            <input
              id="files"
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="sr-only"
              onChange={(e) => setFiles(e.target.files)}
            />
          </label>
          {files && files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(files).map((f, i) => (
                <span key={i} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                  {f.name}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={uploading || !files} className="h-10">
              {uploading ? "جاري الرفع..." : "رفع الملفات"}
            </Button>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </div>
        </form>
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
                <p className="text-[10px] text-muted-foreground">{m.mimeType}</p>
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-x-0 top-0 flex justify-between p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => copyUrl(m)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
                  title="نسخ الرابط"
                >
                  {copiedId === m.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(m.id)}
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
              هل أنت متأكد من حذف هذه الوسائط؟ لا يمكن التراجع عن هذا الإجراء.
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
    </div>
  );
}
