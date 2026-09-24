import { test, expect } from "@playwright/test";
import { seedGallery, cleanupGallery, type SeededGallery } from "./helpers";

let gallery: SeededGallery;

test.describe("Accessibility — Phase A", () => {
  test.beforeAll(async () => {
    gallery = await seedGallery("a11y");
  });

  test.afterAll(async () => {
    await cleanupGallery(gallery);
  });

  test("Skip-to-content link is the first tab stop and moves focus to main", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skip = page.locator("a", { hasText: "تخطَّ إلى المحتوى" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible(); // slides into view when focused

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator("main#main-content")).toBeFocused();
  });

  test("404 page uses the redesigned Arabic layout with header", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-real-page-xyz");
    expect(response?.status()).toBe(404);

    await expect(page.locator("h1")).toContainText("الصفحة غير موجودة");
    await expect(page.locator("a", { hasText: "العودة للرئيسية" })).toBeVisible();
    // Rendered inside the public layout — site chrome still present
    await expect(page.locator("header")).toBeVisible();
  });

  test("Lightbox: focus moves in, arrows navigate, Tab is trapped, focus restores", async ({ page }) => {
    await page.goto(gallery.url);

    const firstThumb = page.locator("button[aria-label^='فتح الصورة']").first();
    await expect(firstThumb).toBeVisible();
    await firstThumb.click();

    const dialog = page.locator("[role='dialog'][aria-modal='true']");
    await expect(dialog).toBeVisible();

    // Initial focus lands on the close button; background is scroll-locked
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe("إغلاق");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    // Arrow keys navigate (RTL semantics: Left = next, Right = previous)
    await page.keyboard.press("ArrowLeft");
    await expect(dialog).toContainText("صورة 2 من 3");
    await page.keyboard.press("ArrowRight");
    await expect(dialog).toContainText("صورة 1 من 3");

    // Focus trap: 3 focusable buttons (close, prev, next) — Tab cycles back to close
    await page.keyboard.press("Tab"); // close -> prev
    await page.keyboard.press("Tab"); // prev -> next
    await page.keyboard.press("Tab"); // next -> wraps to close
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe("إغلاق");

    // Escape closes and focus returns to the thumbnail that opened it
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    await expect(firstThumb).toBeFocused();
  });

  test("Lightbox: touch swipe navigates images", async ({ page }) => {
    await page.goto(gallery.url);
    await page.locator("button[aria-label^='فتح الصورة']").first().click();

    const dialog = page.locator("[role='dialog'][aria-modal='true']");
    await expect(dialog).toBeVisible();

    // Swipe left = next (matches RTL arrow semantics)
    await page.evaluate(() => {
      const el = document.querySelector("[role='dialog']")!;
      el.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          touches: [new Touch({ identifier: 1, target: el, clientX: 300, clientY: 300 })],
        })
      );
      el.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          changedTouches: [new Touch({ identifier: 1, target: el, clientX: 100, clientY: 300 })],
        })
      );
    });
    await expect(dialog).toContainText("صورة 2 من 3");

    // Swipe right = previous
    await page.evaluate(() => {
      const el = document.querySelector("[role='dialog']")!;
      el.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          touches: [new Touch({ identifier: 1, target: el, clientX: 100, clientY: 300 })],
        })
      );
      el.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          changedTouches: [new Touch({ identifier: 1, target: el, clientX: 300, clientY: 300 })],
        })
      );
    });
    await expect(dialog).toContainText("صورة 1 من 3");
  });
});
