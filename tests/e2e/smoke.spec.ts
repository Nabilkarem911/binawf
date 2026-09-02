import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const ADMIN_EMAIL = "admin@binawf.local";
const ADMIN_PASSWORD = "Binawf2026!";

function attachErrorCollectors(page: Page, errors: { console: string[]; network: string[] }) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      errors.console.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      errors.network.push(`${res.url()} -> ${res.status()}`);
    }
  });
}

async function takeScreenshot(page: Page, name: string) {
  const dir = path.join(process.cwd(), "test-results", "screenshots");
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

function assertNoErrors(errors: { console: string[]; network: string[] }, name: string) {
  const all = [...errors.console, ...errors.network];
  const filtered = all.filter((e) => !e.includes("favicon.ico") && !e.includes("google"));
  expect(filtered, `Console/Network errors in ${name}: ${filtered.join("; ")}`).toHaveLength(0);
}

test.describe("Public site", () => {
  let errors = { console: [] as string[], network: [] as string[] };

  test("Homepage renders Arabic RTL and navigation", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/");
    await expect(page).toHaveTitle(/موهبة فنان/);

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ar");
    await expect(html).toHaveAttribute("dir", "rtl");

    const header = page.locator("header");
    await expect(header).toContainText("موهبة فنان");
    await expect(page.locator("nav")).toContainText("التربية الخاصة");
    await expect(page.locator("nav")).toContainText("اليوم الوطني");

    await takeScreenshot(page, "01-homepage");
    assertNoErrors(errors, "homepage");
  });

  test("Category page renders nested categories", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/national-day");
    await expect(page.locator("h1")).toContainText("اليوم الوطني");
    await expect(page.locator("body")).toContainText("اليوم الوطني ٩١");
    await expect(page.locator("body")).toContainText("اليوم الوطني ٩٥");

    await takeScreenshot(page, "02-category-national-day");
    assertNoErrors(errors, "category page");
  });

  test("Post page renders content", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/art-education-news/new-website-launch");
    await expect(page.locator("h1")).toContainText("إطلاق الموقع الجديد");
    await expect(page.locator("article")).toContainText("موهبة فنان");

    await takeScreenshot(page, "03-post");
    assertNoErrors(errors, "post page");
  });

  test("Search returns results", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/search?q=موهبة");
    await expect(page.locator("h1")).toContainText("نتائج البحث");
    await expect(page.locator("body")).toContainText("إطلاق الموقع الجديد");

    await takeScreenshot(page, "04-search");
    assertNoErrors(errors, "search");
  });

  test("Sitemap and robots are accessible", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Disallow: /admin");
  });

  test("404 page returns not found", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    const response = await page.goto("/nonexistent-page");
    expect(response?.status()).toBe(404);

    await takeScreenshot(page, "05-404");
  });

  test("Mobile responsive layout", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();

    const menuButton = page.locator("[aria-label='القائمة']");
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator("[data-slot='sheet-content'] >> text=التربية الخاصة")).toBeVisible();

    await takeScreenshot(page, "06-mobile-menu");
    assertNoErrors(errors, "mobile responsive");
  });
});

test.describe("Admin dashboard", () => {
  let errors = { console: [] as string[], network: [] as string[] };

  test("Admin login works", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/admin/login");
    await expect(page.locator("h1")).toContainText("تسجيل الدخول");

    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.click("button:has-text('دخول')");

    await page.waitForURL("/admin");
    await expect(page.locator("h1")).toContainText("لوحة التحكم");

    await takeScreenshot(page, "07-admin-dashboard");
    assertNoErrors(errors, "admin login");
  });

  test("Create and edit and delete content", async ({ page }) => {
    const contentTitle = `اختبار مقال ${Date.now()}`;
    const newTitle = `مقال معدّل ${Date.now()}`;
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/admin/login");
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.click("button:has-text('دخول')");
    await page.waitForURL("/admin");

    await page.goto("/admin/content/new");
    await expect(page.locator("h1")).toContainText("إنشاء محتوى جديد");

    await page.fill("input#title", contentTitle);
    await page.fill("input#slug", `test-article-${Date.now()}`);
    await page.click("button:has-text('حفظ')");

    await page.waitForURL("/admin/content");
    await expect(page.locator("body")).toContainText(contentTitle);

    await page.getByRole("link", { name: contentTitle }).first().click();

    await expect(page.locator("h1")).toContainText("تعديل محتوى");
    await page.fill("input#title", newTitle);
    await page.click("button:has-text('حفظ')");

    await page.waitForURL("/admin/content");
    await expect(page.locator("body")).toContainText(newTitle);

    await page.click(`text=${newTitle}`);
    await page.click("button:has-text('حذف')");
    await page.waitForURL("/admin/content");
    await expect(page.locator("body")).not.toContainText(newTitle);

    await takeScreenshot(page, "08-admin-content-crud");
    assertNoErrors(errors, "admin content CRUD");
  });

  test("Create and edit and delete category", async ({ page }) => {
    const catTitle = `قسم اختبار ${Date.now()}`;
    const newTitle = `قسم معدّل ${Date.now()}`;
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/admin/login");
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.click("button:has-text('دخول')");
    await page.waitForURL("/admin");

    await page.goto("/admin/categories/new");
    await expect(page.locator("h1")).toContainText("إنشاء قسم جديد");

    await page.fill("input#title", catTitle);
    await page.fill("input#slug", `test-cat-${Date.now()}`);
    await page.click("button:has-text('حفظ')");

    await page.waitForURL("/admin/categories");
    await expect(page.locator("body")).toContainText(catTitle);

    await page.getByRole("link", { name: catTitle }).first().click();
    await expect(page.locator("h1")).toContainText("تعديل قسم");
    await page.fill("input#title", newTitle);
    await page.click("button:has-text('حفظ')");

    await page.waitForURL("/admin/categories");
    await expect(page.locator("body")).toContainText(newTitle);

    await page.getByRole("link", { name: newTitle }).first().click();
    await page.click("button:has-text('حذف')");
    await page.waitForURL("/admin/categories");
    await expect(page.locator("body")).not.toContainText(newTitle);

    await takeScreenshot(page, "09-admin-category-crud");
    assertNoErrors(errors, "admin category CRUD");
  });

  test("Upload and view media", async ({ page }) => {
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/admin/login");
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.click("button:has-text('دخول')");
    await page.waitForURL("/admin");

    // Create a 1x1 transparent PNG
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const buffer = Buffer.from(pngBase64, "base64");
    const tmpFile = path.join(process.cwd(), "test-results", "test-image.png");
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, buffer);

    await page.goto("/admin/media");
    await expect(page.locator("h1")).toContainText("الوسائط");

    const input = page.locator("input[type='file']");
    await input.setInputFiles(tmpFile);
    await page.click("button:has-text('رفع')");

    await expect(page.locator("body")).toContainText("تم رفع الملفات");
    await expect(page.locator("table")).toContainText("test-image.png");

    await takeScreenshot(page, "10-admin-media");
    assertNoErrors(errors, "admin media upload");
  });

  test("Update site settings and reflect on public site", async ({ page }) => {
    const newTitle = `موهبة فنان - اختبار ${Date.now()}`;
    errors = { console: [], network: [] };
    attachErrorCollectors(page, errors);

    await page.goto("/admin/login");
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.click("button:has-text('دخول')");
    await page.waitForURL("/admin");

    await page.goto("/admin/settings");
    await expect(page.locator("h1")).toContainText("إعدادات الموقع");

    await page.fill("input#site_title", newTitle);
    await page.click("button:has-text('حفظ')");
    await expect(page.locator("body")).toContainText("تم حفظ الإعدادات");

    await page.goto("/");
    await expect(page.locator("header")).toContainText(newTitle);

    await takeScreenshot(page, "11-settings-public");
    assertNoErrors(errors, "settings update");
  });
});
