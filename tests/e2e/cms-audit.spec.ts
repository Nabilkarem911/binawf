import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const ADMIN_EMAIL = "admin@binawf.local";
const ADMIN_PASSWORD = "Binawf2026!";

// Reuse authenticated session across tests to avoid rate limiter
let savedCookies: any[] | null = null;

async function adminLogin(page: Page) {
  // If we have saved cookies, restore them first
  if (savedCookies && savedCookies.length > 0) {
    await page.context().addCookies(savedCookies);
  }
  // Try going to /admin directly
  await page.goto("/admin");
  // If we're on /admin, we're logged in
  if (page.url().includes("/admin/login")) {
    // Need to login - use the form's submit button specifically
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    // Use the login form's button specifically (it's the visible one in the main content)
    await page.locator("form button[type='submit']:visible").click();
    await page.waitForURL("/admin", { timeout: 15000 });
    // Save cookies for reuse
    savedCookies = await page.context().cookies();
  }
}

test.describe("CMS Audit Repair - Navigation CRUD", () => {
  const uniqueTitle = `رابط اختبار ${Date.now()}`;
  const editedTitle = `رابط معدّل ${Date.now()}`;

  test("Create navigation item", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/navigation/new");
    await expect(page.locator("h1")).toContainText("عنصر قائمة جديد");
    await page.fill("input#title", uniqueTitle);
    await page.fill("input#url", `/test-nav-${Date.now()}`);
    await page.click("button:has-text('حفظ')");
    await page.waitForURL("/admin/navigation", { timeout: 15000 });
    await expect(page.locator("body")).toContainText(uniqueTitle);
  });

  test("Edit navigation item", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/navigation");
    // Find the edit link in the same row as our unique title
    const itemText = page.locator(`p:has-text('${uniqueTitle}')`).first();
    const row = itemText.locator("xpath=ancestor::div[contains(@class,'flex') and contains(@class,'items-center')]").first();
    const editLink = row.locator("a:has-text('تعديل')");
    const editHref = await editLink.getAttribute("href");
    expect(editHref).toBeTruthy();
    await page.goto(editHref!);
    await expect(page.locator("h1")).toContainText("تعديل", { timeout: 15000 });
    await page.fill("input#title", editedTitle);
    await page.click("button:has-text('حفظ')");
    await page.waitForURL("/admin/navigation", { timeout: 15000 });
    await expect(page.locator("body")).toContainText(editedTitle);
  });

  test("Toggle navigation visibility persists", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/navigation");
    // Find the toggle button in the same row as our edited title
    const itemText = page.locator(`p:has-text('${editedTitle}')`).first();
    const row = itemText.locator("xpath=ancestor::div[contains(@class,'flex') and contains(@class,'items-center')]").first();
    const toggleBtn = row.locator("button:has-text('ظاهر'), button:has-text('مخفي')");
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    const initialText = await toggleBtn.textContent();
    await toggleBtn.click();
    await page.waitForTimeout(3000);
    await page.reload();
    const itemText2 = page.locator(`p:has-text('${editedTitle}')`).first();
    const row2 = itemText2.locator("xpath=ancestor::div[contains(@class,'flex') and contains(@class,'items-center')]").first();
    const toggleBtn2 = row2.locator("button:has-text('ظاهر'), button:has-text('مخفي')");
    const toggledText = await toggleBtn2.textContent();
    expect(toggledText).not.toBe(initialText);
  });

  test("Delete navigation item", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/navigation");
    await expect(page.locator("body")).toContainText(editedTitle);
    const itemText = page.locator(`p:has-text('${editedTitle}')`).first();
    const row = itemText.locator("xpath=ancestor::div[contains(@class,'flex') and contains(@class,'items-center')]").first();
    const editLink = row.locator("a:has-text('تعديل')");
    const editHref = await editLink.getAttribute("href");
    expect(editHref).toBeTruthy();
    await page.goto(editHref!);
    await page.click("button:has-text('حذف')");
    await page.locator("button:has-text('نعم، احذف')").click();
    await page.waitForURL("/admin/navigation", { timeout: 15000 });
    await expect(page.locator("body")).not.toContainText(editedTitle);
  });
});

test.describe("CMS Audit Repair - Category visibility toggle", () => {
  test("Toggle category visibility persists after refresh", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/categories");
    const toggleBtn = page.locator("button[title='إخفاء'], button[title='إظهار']").first();
    if (await toggleBtn.count() > 0) {
      const initialTitle = await toggleBtn.getAttribute("title");
      await toggleBtn.click();
      await page.waitForTimeout(2000);
      await page.reload();
      const newToggleBtn = page.locator("button[title='إخفاء'], button[title='إظهار']").first();
      const newTitle = await newToggleBtn.getAttribute("title");
      expect(newTitle).not.toBe(initialTitle);
    }
  });
});

test.describe("CMS Audit Repair - Arabic labels in Selects", () => {
  test("Content form does not show raw enum values", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/content/new");
    await expect(page.locator("h1")).toContainText("إنشاء محتوى جديد");
    // Check that select trigger text doesn't show raw enum values
    const triggerTexts = await page.locator("[data-slot='select-trigger']").allTextContents();
    const joined = triggerTexts.join(" ");
    expect(joined).not.toMatch(/\bDRAFT\b/);
    expect(joined).not.toMatch(/\bPUBLISHED\b/);
    expect(joined).not.toMatch(/\bARCHIVED\b/);
  });

  test("Category form does not show raw enum values", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/categories/new");
    await expect(page.locator("h1")).toContainText("إنشاء قسم جديد");
    const triggerTexts = await page.locator("[data-slot='select-trigger']").allTextContents();
    const joined = triggerTexts.join(" ");
    expect(joined).not.toMatch(/\bARTICLE\b/);
    expect(joined).not.toMatch(/\bNEWS\b/);
  });
});

test.describe("CMS Audit Repair - Media upload and featured image", () => {
  test("Upload media via media library", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/media");
    await expect(page.locator("h1")).toContainText("مكتبة الوسائط");

    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const buffer = Buffer.from(pngBase64, "base64");
    const uniqueName = `cms-audit-upload-${Date.now()}.png`;
    const tmpFile = path.join(process.cwd(), "test-results", uniqueName);
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, buffer);

    const input = page.locator("input[type='file']");
    await input.setInputFiles(tmpFile);
    // Wait for upload to complete - look for the success checkmark or the filename
    await page.waitForTimeout(5000);
    // The page should auto-refresh via router.refresh() after upload
    await expect(page.locator("body")).toContainText(uniqueName);
  });

  test("Content form has featured image picker", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/content/new");
    await expect(page.locator("text=الصورة الرئيسية")).toBeVisible();
  });

  test("Category form has image picker", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/categories/new");
    await expect(page.locator("text=صورة القسم")).toBeVisible();
  });
});

test.describe("CMS Audit Repair - Rich text editor", () => {
  test("Content form has rich text editor (not plain textarea)", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/content/new");
    await expect(page.locator("[contenteditable]")).toBeVisible();
  });
});

test.describe("CMS Audit Repair - Navigation new route exists", () => {
  test("/admin/navigation/new is accessible (not 404)", async ({ page }) => {
    await adminLogin(page);
    const response = await page.goto("/admin/navigation/new");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("عنصر قائمة جديد");
  });
});

test.describe("CMS Audit Repair - Mobile admin responsive", () => {
  test("Admin content form works on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await adminLogin(page);
    await page.goto("/admin/content/new");
    await expect(page.locator("h1")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("Admin categories page works on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await adminLogin(page);
    await page.goto("/admin/categories");
    await expect(page.locator("h1")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("Admin navigation page works on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await adminLogin(page);
    await page.goto("/admin/navigation");
    await expect(page.locator("h1")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("Admin media page works on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await adminLogin(page);
    await page.goto("/admin/media");
    await expect(page.locator("h1")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
