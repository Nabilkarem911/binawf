import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { adminLogin, seedGallery, cleanupGallery, updatePostTitle } from "./helpers";

// Fallback cleanup so a mid-test failure can't leak nav items into other specs
async function deleteNavItemsByTitle(title: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("DELETE FROM navigation_items WHERE title = $1", [title]);
  } finally {
    await client.end();
  }
}

test.describe("Public caching & invalidation", () => {
  test("navigation changes appear on the public site immediately", async ({ page }) => {
    const url = `/cache-test-${Date.now()}`;
    const title = `رابط كاش ${Date.now()}`;

    try {
      await adminLogin(page);
      await page.goto("/admin/navigation/new");
      await page.fill("input#title", title);
      await page.fill("input#url", url);
      await page.click("button:has-text('حفظ')");
      await page.waitForURL("/admin/navigation", { timeout: 15000 });

      // The header reflects the new item: tagged data cache + layout purge
      await page.goto("/");
      await expect(page.locator(`header a[href="${url}"]`)).toHaveCount(1);

      // Delete it — the header must drop it too. The delete control is an
      // icon-only button (label="") inside the item card's action row.
      await page.goto("/admin/navigation");
      const card = page
        .locator(`p:has-text('${title}')`)
        .first()
        .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
      await card.locator("div.flex.items-center.justify-between").first().locator("button").last().click();
      await page.click("button:has-text('نعم، احذف')");
      await expect(page.locator(`p:has-text('${title}')`)).toHaveCount(0, { timeout: 15000 });

      await page.goto("/");
      await expect(page.locator(`header a[href="${url}"]`)).toHaveCount(0);
    } finally {
      await deleteNavItemsByTitle(title);
    }
  });

  test("post page serves ISR cache, then a CMS write invalidates it", async ({ page }) => {
    const seeded = await seedGallery("cache");
    try {
      await page.goto(seeded.url);
      await expect(page.locator("h1")).toContainText("معرض اختبار مؤقت");

      // A direct DB write bypasses app invalidation: the ISR page stays stale
      await updatePostTitle(seeded.postId, "عنوان معدّل بعد التخزين");
      await page.reload();
      await expect(page.locator("h1")).toContainText("معرض اختبار مؤقت");

      // An authenticated media PATCH calls revalidatePublic() → next visit is fresh
      await adminLogin(page);
      const resp = await page.request.patch(`/api/media?id=${seeded.mediaIds[0]}`, {
        data: { alt: "بديل كاش جديد" },
      });
      expect(resp.status()).toBe(200);

      await page.goto(seeded.url);
      await expect(page.locator("h1")).toContainText("عنوان معدّل بعد التخزين");
      await expect(page.locator('img[alt="بديل كاش جديد"]').first()).toBeAttached();
    } finally {
      await cleanupGallery(seeded);
    }
  });
});
