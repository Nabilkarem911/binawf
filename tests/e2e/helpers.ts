import { Client } from "pg";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@binawf.local";
const ADMIN_PASSWORD = "Binawf2026!";

// Reuse authenticated cookies across tests — the login rate limiter
// allows only 10 attempts per 15 minutes.
let savedCookies: { name: string; value: string; domain: string; path: string }[] | null = null;

export async function adminLogin(page: Page) {
  if (savedCookies && savedCookies.length > 0) {
    await page.context().addCookies(savedCookies);
  }
  await page.goto("/admin");
  if (page.url().includes("/admin/login")) {
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.locator("form button[type='submit']:visible").click();
    await page.waitForURL("/admin", { timeout: 15000 });
    savedCookies = await page.context().cookies();
  }
}

// Real 400x300 PNG generated via sharp at seed time — no leftover-file dependency
let PNG_CACHE: Buffer | null = null;
async function testPng(): Promise<Buffer> {
  if (!PNG_CACHE) {
    const sharp = (await import("sharp")).default;
    PNG_CACHE = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 30, g: 60, b: 120 } },
    })
      .png()
      .toBuffer();
  }
  return PNG_CACHE;
}

export interface SeededGallery {
  url: string;
  mediaUrls: string[];
  postId: string;
  mediaIds: string[];
  files: string[];
}

/** Creates a published GALLERY post with 3 images; returns its public URL and media URLs. */
export async function seedGallery(prefix: string): Promise<SeededGallery> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const files = [1, 2, 3].map((n) => `${prefix}-seed-${n}.png`);
  const mediaIds: string[] = [];
  let postId = "";
  let url = "";

  try {
    const cat = await client.query(
      'SELECT id, slug FROM categories WHERE "deletedAt" IS NULL ORDER BY "sortOrder" LIMIT 1'
    );
    if (cat.rows.length === 0) throw new Error("No category to attach test post to");

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    const png = await testPng();

    for (const file of files) {
      fs.writeFileSync(path.join(uploadDir, file), png);
      const mediaId = crypto.randomUUID();
      mediaIds.push(mediaId);
      await client.query(
        `INSERT INTO media (id, filename, "originalName", url, "mimeType", size, type, alt, "updatedAt")
         VALUES ($1, $2, $3, $4, 'image/png', $5, 'IMAGE', $6, NOW())`,
        [mediaId, file, file, `/api/media?filename=${file}`, png.length, `صورة اختبار ${file}`]
      );
    }

    postId = crypto.randomUUID();
    const slug = `${prefix}-gallery`;
    await client.query(
      `INSERT INTO posts (id, title, slug, excerpt, type, status, "publishedAt", "categoryId", "updatedAt")
       VALUES ($1, 'معرض اختبار مؤقت', $2, 'معرض مؤقت للاختبارات الآلية', 'GALLERY', 'PUBLISHED', NOW(), $3, NOW())`,
      [postId, slug, cat.rows[0].id]
    );
    url = `/${cat.rows[0].slug}/${slug}`;

    for (let i = 0; i < mediaIds.length; i++) {
      await client.query(
        `INSERT INTO post_media (id, "postId", "mediaId", "sortOrder") VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), postId, mediaIds[i], i]
      );
    }
  } finally {
    await client.end();
  }

  return {
    url,
    mediaUrls: files.map((f) => `/api/media?filename=${f}`),
    postId,
    mediaIds,
    files,
  };
}

/** Removes the seeded post/media/files created by seedGallery. */
export async function cleanupGallery(seeded: SeededGallery) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    if (seeded.postId) {
      await client.query('DELETE FROM post_media WHERE "postId" = $1', [seeded.postId]);
      await client.query("DELETE FROM posts WHERE id = $1", [seeded.postId]);
    }
    for (const id of seeded.mediaIds) {
      await client.query("DELETE FROM media WHERE id = $1", [id]);
    }
  } finally {
    await client.end();
  }
  for (const file of seeded.files) {
    try {
      fs.unlinkSync(path.join(process.cwd(), "public", "uploads", file));
    } catch {
      // already gone
    }
  }
}

/**
 * Deletes exactly one media row+file by id via the app's DELETE route.
 * Caller supplies the id returned by the upload response — never deletes
 * by name/pattern, so it can't touch a same-named row it didn't create.
 */
export async function deleteMediaById(page: Page, id: string) {
  const resp = await page.request.delete(`/api/media?id=${id}`);
  expect(resp.ok(), `cleanup DELETE /api/media?id=${id} failed: ${resp.status()}`).toBeTruthy();
}

/** Direct DB write for cache tests — bypasses app invalidation on purpose. */
export async function updatePostTitle(postId: string, title: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("UPDATE posts SET title = $1 WHERE id = $2", [title, postId]);
  } finally {
    await client.end();
  }
}
