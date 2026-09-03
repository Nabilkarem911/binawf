"use client";

import { useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Search,
  Film,
  FileText,
} from "lucide-react";
import Image from "next/image";
import type { Media } from "@prisma/client";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  media?: Media[];
  placeholder?: string;
};

function getMediaUrl(m: Media): string {
  return m.url.startsWith("/uploads/") ? `/api/media?filename=${m.filename}` : m.url;
}

export function RichTextEditor({ value, onChange, media = [], placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilter] = useState("IMAGE");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSyncing = useRef(false);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isSyncing.current = true;
    onChange(editorRef.current.innerHTML);
    setTimeout(() => { isSyncing.current = false; }, 0);
  }, [onChange]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    handleInput();
    editorRef.current?.focus();
  }, [handleInput]);

  const insertHtml = useCallback((html: string) => {
    document.execCommand("insertHTML", false, html);
    handleInput();
    editorRef.current?.focus();
  }, [handleInput]);

  const handleBold = () => exec("bold");
  const handleItalic = () => exec("italic");
  const handleH1 = () => exec("formatBlock", "<h1>");
  const handleH2 = () => exec("formatBlock", "<h2>");
  const handleH3 = () => exec("formatBlock", "<h3>");
  const handleUL = () => exec("insertUnorderedList");
  const handleOL = () => exec("insertOrderedList");
  const handleQuote = () => exec("formatBlock", "<blockquote>");
  const handleUndo = () => exec("undo");
  const handleRedo = () => exec("redo");
  const handleAlignRight = () => exec("justifyRight");
  const handleAlignCenter = () => exec("justifyCenter");
  const handleAlignLeft = () => exec("justifyLeft");

  const handleInsertLink = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    setLinkText(selectedText);
    setLinkUrl("");
    setShowLinkDialog(true);
  };

  const confirmInsertLink = () => {
    if (!linkUrl) return;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    const html = linkText
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
      : `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    insertHtml(html);
    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = (m: Media) => {
    const url = getMediaUrl(m);
    const alt = m.alt || m.originalName;
    insertHtml(`<img src="${url}" alt="${alt}" loading="lazy" style="max-width:100%;height:auto;border-radius:0.5rem;" />`);
    setShowMediaPicker(false);
  };

  const handleUploadAndInsert = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/media", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.media) {
            handleInsertImage(data.media);
          }
        }
      } catch {
        // ignore
      }
    }
  };

  const filteredMedia = media.filter((m) => {
    if (mediaFilter !== "ALL" && m.type !== mediaFilter) return false;
    if (mediaSearch && !m.originalName.toLowerCase().includes(mediaSearch.toLowerCase())) return false;
    return true;
  });

  const toolbarBtn = "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/30 p-1.5">
        <button type="button" onClick={handleBold} className={toolbarBtn} title="عريض">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleItalic} className={toolbarBtn} title="مائل">
          <Italic className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={handleH1} className={toolbarBtn} title="عنوان ١">
          <Heading1 className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleH2} className={toolbarBtn} title="عنوان ٢">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleH3} className={toolbarBtn} title="عنوان ٣">
          <Heading3 className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={handleUL} className={toolbarBtn} title="قائمة نقطية">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleOL} className={toolbarBtn} title="قائمة مرقمة">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleQuote} className={toolbarBtn} title="اقتباس">
          <Quote className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={handleAlignRight} className={toolbarBtn} title="محاذاة لليمين">
          <AlignRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleAlignCenter} className={toolbarBtn} title="توسيط">
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleAlignLeft} className={toolbarBtn} title="محاذاة لليسار">
          <AlignLeft className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={handleInsertLink} className={toolbarBtn} title="رابط">
          <LinkIcon className="h-4 w-4" />
        </button>
        <Dialog open={showMediaPicker} onOpenChange={setShowMediaPicker}>
          <DialogTrigger
            render={<button type="button" className={toolbarBtn} title="صورة من المكتبة"><ImageIcon className="h-4 w-4" /></button>}
          />
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>اختيار صورة من المكتبة</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => e.target.files && handleUploadAndInsert(e.target.files)}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  رفع صورة جديدة
                </button>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="ابحث..."
                  className="h-9 w-full rounded-lg border border-border bg-background pr-9 pl-4 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredMedia.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">لا توجد صور</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {filteredMedia.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleInsertImage(m)}
                        className="group relative overflow-hidden rounded-lg border border-border/60 transition-all hover:border-accent"
                      >
                        <div className="relative aspect-square overflow-hidden bg-secondary">
                          {m.type === "IMAGE" ? (
                            <Image src={getMediaUrl(m)} alt={m.alt || m.originalName} fill className="object-cover" unoptimized sizes="100px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              {m.type === "VIDEO_LINK" ? <Film className="h-5 w-5 text-muted-foreground/40" /> : <FileText className="h-5 w-5 text-muted-foreground/40" />}
                            </div>
                          )}
                        </div>
                        <p className="truncate p-1 text-[10px]">{m.originalName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <div className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={handleUndo} className={toolbarBtn} title="تراجع">
          <Undo className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleRedo} className={toolbarBtn} title="إعادة">
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        dir="rtl"
        data-placeholder={placeholder}
        className="prose prose-sm max-w-none min-h-[300px] p-4 outline-none focus:outline-none [&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pr-6 [&_ol]:list-decimal [&_ol]:pr-6 [&_blockquote]:border-r-4 [&_blockquote]:border-border [&_blockquote]:pr-4 [&_blockquote]:text-muted-foreground [&_img]:rounded-lg [&_a]:text-accent [&_a]:underline empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        dangerouslySetInnerHTML={{ __html: value }}
        key={value}
      />

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-navy">
            <h3 className="mb-4 text-lg font-bold text-foreground">إدراج رابط</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">النص (اختياري)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  placeholder="نص الرابط"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">الرابط (URL)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  dir="ltr"
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={confirmInsertLink}
                disabled={!linkUrl}
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                إدراج
              </button>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
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
