"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Media } from "@prisma/client";

export function MediaUploadForm({ media }: { media: Media[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
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

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4 rounded-xl bg-muted/30 p-4">
        <div className="space-y-2">
          <Label htmlFor="files">اختيار ملفات</Label>
          <Input
            id="files"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setFiles(e.target.files)}
          />
        </div>
        <Button type="submit" disabled={uploading || !files}>
          {uploading ? "جاري الرفع..." : "رفع"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>

      <div className="rounded-xl bg-background ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>معاينة</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الرابط</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {media.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  {m.type === "IMAGE" ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded">
                      <Image
                        src={m.url.startsWith("/uploads/") ? `/api/media?filename=${m.filename}` : m.url}
                        alt={m.alt || m.originalName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{m.originalName}</TableCell>
                <TableCell>{m.mimeType}</TableCell>
                <TableCell dir="ltr" className="text-sm text-muted-foreground max-w-xs truncate">
                  {m.url}
                </TableCell>
              </TableRow>
            ))}
            {media.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  لا توجد وسائط.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
