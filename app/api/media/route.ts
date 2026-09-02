import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

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
      url: `/uploads/${safeName}`,
      mimeType: file.type,
      size: file.size,
      type: isVideo ? MediaType.VIDEO_LINK : isImage ? MediaType.IMAGE : MediaType.DOCUMENT,
      alt,
      caption,
    },
  });

  return NextResponse.json({ media });
}
