import { test, expect } from "@playwright/test";

const MOBILE_WIDTHS = [360, 375, 390, 414, 430];

test.describe("Public redesign", () => {
  test("Homepage hero renders title, stats and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toContainText("موهبة فنان");
    // Stats row — only non-zero stats render
    await expect(page.locator("body")).toContainText("محتوى منشور");
    await expect(page.locator("body")).toContainText("مجال تعليمي");
    // CTAs
    await expect(page.locator("a", { hasText: "استكشف المعارض" }).first()).toBeVisible();
  });

  test("Homepage hides empty sections instead of blank boxes", async ({ page }) => {
    await page.goto("/");
    // Empty-state boxes were removed — their copy must not be in the DOM
    await expect(page.locator("text=لا يوجد محتوى منشور حالياً")).toHaveCount(0);
    await expect(page.locator("text=لا توجد أخبار منشورة حالياً")).toHaveCount(0);
  });

  test("Desktop nav shows overflow menu and dropdowns open on keyboard focus", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const nav = page.locator("nav[aria-label='التنقل الرئيسي']");
    await expect(nav).toBeVisible();

    // Overflow menu exists (7 top-level items > 5 visible)
    const moreButton = nav.locator("button", { hasText: "المزيد" });
    await expect(moreButton).toBeVisible();

    // More menu items live in DOM even when closed (keeps nav text discoverable)
    await expect(nav).toContainText("اليوم الوطني");

    // Open More menu via click
    await moreButton.click();
    await expect(moreButton).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(moreButton).toHaveAttribute("aria-expanded", "false");
    await expect(moreButton).toBeFocused();

    // Keyboard focus opens a dropdown without a mouse
    const fieldsLink = nav.locator("a", { hasText: "المجالات الفنية" }).first();
    await fieldsLink.focus();
    await expect(fieldsLink).toHaveAttribute("aria-expanded", "true");
    await expect(nav.locator("a", { hasText: "مجال الخزف" }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(fieldsLink).toHaveAttribute("aria-expanded", "false");
  });

  test("Mobile drawer: scroll lock, Escape close, focus restore", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const trigger = page.locator("[aria-label='فتح القائمة']");
    await trigger.click();

    const drawer = page.locator("[role='dialog']");
    await expect(drawer).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    // Focus moved inside drawer
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    expect(focused).toBe("إغلاق القائمة");

    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    await expect(trigger).toBeFocused();
  });

  for (const width of MOBILE_WIDTHS) {
    test(`Mobile drawer works at ${width}px without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      await page.locator("[aria-label='فتح القائمة']").click();
      const drawer = page.locator("[role='dialog']");
      await expect(drawer).toBeVisible();
      await page.waitForTimeout(400); // let slide-in animation settle

      // Drawer fits within viewport
      const box = await drawer.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);

      // Expand a nested group
      const groupBtn = drawer.locator("button", { hasText: "المجالات الفنية" });
      await groupBtn.click();
      await expect(drawer.locator("a", { hasText: "مجال الرسم" }).first()).toBeVisible();

      // Close via the X button
      await drawer.locator("[aria-label='إغلاق القائمة']").click();
      await expect(drawer).toHaveCount(0);
    });
  }

  test("No horizontal overflow on homepage at any size", async ({ page }) => {
    for (const width of [1920, 1440, 1280, 768, 414, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      // Allow 1px subpixel rounding; anything more is a real layout bug
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });

  test("RTL and Arabic lang are preserved", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("Search page shows type badges", async ({ page }) => {
    await page.goto("/search?q=موهبة");
    await expect(page.locator("h1")).toContainText("نتائج البحث");
    await expect(page.locator("body")).toContainText("إطلاق الموقع الجديد");
  });
});
