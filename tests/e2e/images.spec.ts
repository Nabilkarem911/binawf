import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { seedGallery, cleanupGallery, type SeededGallery } from "./helpers";

let gallery: SeededGallery;

test.describe("Image optimization — Phase B", () => {
  test.beforeAll(async () => {
    gallery = await seedGallery("imgopt");
  });

  test.afterAll(async () => {
    await cleanupGallery(gallery);
  });

  test("Media images are served through the Next optimizer", async ({ page, request }) => {
    await page.goto(gallery.url);

    const thumbs = page.locator("button[aria-label^='فتح الصورة'] img");
    await expect(thumbs.first()).toBeVisible();
    const count = await thumbs.count();
    expect(count).toBe(3);

    // Every grid image goes through /_next/image and carries a responsive srcset
    for (let i = 0; i < count; i++) {
      const src = await thumbs.nth(i).getAttribute("src");
      const srcset = await thumbs.nth(i).getAttribute("srcset");
      expect(src).toContain("/_next/image");
      expect(src).toContain(encodeURIComponent("/api/media?filename=imgopt-seed"));
      expect(srcset).toContain("/_next/image");
      // Image actually decodes — naturalWidth is density-corrected under
      // srcset w-descriptors (next/image), so assert decode() resolves instead
      await thumbs.nth(i).scrollIntoViewIfNeeded();
      await expect(async () => {
        await thumbs.nth(i).evaluate((el) => (el as HTMLImageElement).decode());
      }).toPass();
    }

    // The optimizer negotiates webp when the client accepts it
    const optimized = await request.get(
      `/_next/image?url=${encodeURIComponent(gallery.mediaUrls[0])}&w=640&q=75`,
      { headers: { Accept: "image/webp" } }
    );
    expect(optimized.status()).toBe(200);
    expect(optimized.headers()["content-type"]).toBe("image/webp");
  });

  test("Original media endpoint still serves the untouched file", async ({ request }) => {
    const original = await request.get(gallery.mediaUrls[0]);
    expect(original.status()).toBe(200);
    expect(original.headers()["content-type"]).toBe("image/png");
  });

  test("Lightbox image is optimized too", async ({ page }) => {
    await page.goto(gallery.url);
    await page.locator("button[aria-label^='فتح الصورة']").first().click();

    const dialog = page.locator("[role='dialog']");
    const lightboxImg = dialog.locator("img").first();
    await expect(lightboxImg).toBeVisible();
    expect(await lightboxImg.getAttribute("src")).toContain("/_next/image");
  });

  test("GIF media URLs pass through the optimizer without 400", async ({ page }) => {
    // Write a real (static) 1x1 GIF and request it through the optimizer.
    // Animated GIFs are auto-detected by Next's optimizer and served unoptimized
    // (image-optimizer.js: is-animated check), so no special handling is needed.
    const gifFile = "imgopt-probe.gif";
    const gifPath = path.join(process.cwd(), "public", "uploads", gifFile);
    fs.writeFileSync(
      gifPath,
      Buffer.from(
        "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
        "base64"
      )
    );
    try {
      const res = await page.request.get(
        `/_next/image?url=${encodeURIComponent(`/api/media?filename=${gifFile}`)}&w=640&q=75`
      );
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toMatch(/^image\//);
    } finally {
      fs.unlinkSync(gifPath);
    }
  });
});
