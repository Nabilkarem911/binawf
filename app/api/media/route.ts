import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".png"
    ? "image/png"
    : ext === ".jpg" || ext === ".jpeg"
    ? "image/jpeg"
    : ext === ".gif"
    ? "image/gif"
    : ext === ".svg"
    ? "image/svg+xml"
    : ext === ".webp"
    ? "image/webp"
    : ext === ".mp4"
    ? "video/mp4"
    : "application/octet-stream";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  // Prevent path traversal
  const safe = path.basename(filename.replace(/[^\w.-]/g, "_"));
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
        "Content-Type": getMimeType(resolved),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const alt = (formData.get("alt") as string) || "";
  const caption = (formData.get("caption") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const filePath = path.join(UPLOAD_DIR, safeName);

  await writeFile(filePath, buffer);

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  const media = await prisma.media.create({
    data: {
      filename: safeName,
      originalName: file.name,
      url: `/api/media?filename=${safeName}`,
      mimeType: file.type,
      size: file.size,
      type: isVideo ? MediaType.VIDEO_LINK : isImage ? MediaType.IMAGE : MediaType.DOCUMENT,
      alt,
      caption,
    },
  });

  return NextResponse.json({ media });
}
