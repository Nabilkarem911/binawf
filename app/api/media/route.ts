import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Allowed upload types — extension allowlist (defense in depth: magic bytes too).
// NO svg/html/js/executables: a stored SVG/HTML on the same origin = stored XSS.
const ALLOWED: Record<string, { mime: string; inline: boolean }> = {
  png: { mime: "image/png", inline: true },
  jpg: { mime: "image/jpeg", inline: true },
  jpeg: { mime: "image/jpeg", inline: true },
  gif: { mime: "image/gif", inline: true },
  webp: { mime: "image/webp", inline: true },
  mp4: { mime: "video/mp4", inline: true },
  pdf: { mime: "application/pdf", inline: true },
};

function maxUploadBytes(): number {
  const raw = process.env["MAX_UPLOAD_MB"];
  const mb = raw ? Number(raw) : 25;
  const safe = Number.isFinite(mb) && mb > 0 ? mb : 25;
  return Math.min(safe, 500) * 1024 * 1024;
}

/** Minimal magic-byte sniff for the allowed types (first 12 bytes suffice). */
function sniffMatches(ext: string, buf: Buffer): boolean {
  if (ext === "png") return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === "jpg" || ext === "jpeg") return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (ext === "gif") return buf.length >= 6 && buf.subarray(0, 6).toString("ascii").startsWith("GIF8");
  if (ext === "webp") return buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  if (ext === "mp4") return buf.length >= 12 && buf.subarray(4, 8).toString("ascii") === "ftyp";
  if (ext === "pdf") return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
  return false; // unknown ext already rejected before sniffing
}

function resolveSafeFilename(filename: string): string {
  return path.basename(filename.replace(/[^\w.-]/g, "_"));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 });

  const safe = resolveSafeFilename(filename);
  const ext = path.extname(safe).toLowerCase().replace(".", "");
  const entry = ALLOWED[ext];
  if (!entry) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filePath = path.join(UPLOAD_DIR, safe);
  const resolved = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(UPLOAD_DIR);
  if (!resolved.startsWith(resolvedUploadDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(resolved);
    return new NextResponse(data, {
      headers: {
        "Content-Type": entry.mime,
        "Content-Disposition": entry.inline ? "inline" : `attachment; filename="${safe}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const alt = (formData.get("alt") as string) || "";
  const caption = (formData.get("caption") as string) || "";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Size cap first (before buffering the whole file)
  if (file.size > maxUploadBytes()) {
    return NextResponse.json(
      { error: `حجم الملف أكبر من الحد المسموح (${Math.round(maxUploadBytes() / 1024 / 1024)}MB)` },
      { status: 413 }
    );
  }

  const originalExt = path.extname(file.name).toLowerCase().replace(".", "");
  const entry = ALLOWED[originalExt];
  if (!entry) {
    return NextResponse.json(
      { error: "نوع الملف غير مدعوم — يُسمح فقط بـ: PNG, JPG, GIF, WebP, MP4, PDF" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Magic-byte check — the extension alone is not proof of content
  if (!sniffMatches(originalExt, buffer)) {
    return NextResponse.json({ error: "محتويات الملف لا تطابق نوعه المعلن" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  await writeFile(filePath, buffer);

  const type = entry.mime.startsWith("image/")
    ? MediaType.IMAGE
    : entry.mime.startsWith("video/")
      ? MediaType.VIDEO_LINK
      : MediaType.DOCUMENT;

  const media = await prisma.media.create({
    data: {
      filename: safeName,
      originalName: file.name,
      url: `/api/media?filename=${safeName}`,
      mimeType: entry.mime,
      size: file.size,
      type,
      alt,
      caption,
    },
  });

  return NextResponse.json({ media });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check if media is referenced by posts or categories
  const [postFeaturedCount, categoryImageCount, postMediaCount] = await Promise.all([
    prisma.post.count({ where: { featuredImageId: id } }),
    prisma.category.count({ where: { imageId: id } }),
    prisma.postMedia.count({ where: { mediaId: id } }),
  ]);

  const refCount = postFeaturedCount + categoryImageCount + postMediaCount;
  if (refCount > 0) {
    return NextResponse.json(
      {
        error: `لا يمكن حذف هذه الوسائط لأنها مستخدمة في ${refCount} عنصر. أزل المراجع أولاً.`,
        refCount,
      },
      { status: 409 }
    );
  }

  // Delete file from disk if it's a local upload
  if (media.url.includes("/api/media?filename=") || media.url.startsWith("/uploads/")) {
    try {
      const filePath = path.join(UPLOAD_DIR, media.filename);
      const resolved = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(UPLOAD_DIR);
      if (resolved.startsWith(resolvedUploadDir)) {
        const { unlink } = await import("fs/promises");
        await unlink(resolved);
      }
    } catch {
      // File may already be gone — ignore
    }
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await request.json();
  const { alt, caption } = body as { alt?: string; caption?: string };

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.media.update({
    where: { id },
    data: {
      ...(alt !== undefined ? { alt } : {}),
      ...(caption !== undefined ? { caption } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
