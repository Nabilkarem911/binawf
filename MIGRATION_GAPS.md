# Migration Gaps — Abdulrahman bin Auf Art Education Site

**Source:** Google Sites — `https://sites.google.com/view/binawf/الصفحة-الرئيسية`  
**Date:** 2025

## Overview

This document identifies content that cannot be directly migrated from the Google Sites platform to the new Next.js site, along with recommended solutions for each gap.

---

## 1. Google Drive Embeddings — المعارض الافتراضية (Virtual Exhibitions)

**Affected page:** `/المعارض-الافتراضية`  
**Severity:** HIGH — This is the only page with embedded Google Drive content

### Problem

The Virtual Exhibitions page contains:
- **3 iframe embeds** pointing to Google Drive content (likely virtual tour or embedded presentation files)
- **15 Google Drive reference URLs** (Drive file icons and links)
- **5 images** (including Drive product icons like `google.com/images/icons/product/drive-32.png`)

The Google Drive embeds use iframe src URLs that reference `drive.google.com` with embedded file IDs. These files are:
1. Stored on the Google account of the site owner
2. Accessible only as long as the Google account is active and files are shared
3. Not downloadable via simple HTTP scraping — they require Google Drive API or manual download
4. May be Google Slides, Google Docs, or other Google Workspace files that don't have a direct file format equivalent

### Recommended Solutions

| Option | Effort | Description |
|---|---|---|
| **A. Manual download + re-host** | Medium | Site owner manually downloads each Drive file (if presentations, export as PDF/images), uploads to new site as downloadable files or embedded viewers. |
| **B. Preserve Drive embed iframes** | Low | Keep the Google Drive iframe embeds as-is in the new site. **Risk:** If the Google account is deactivated or files are unshared, embeds break. Not recommended for long-term. |
| **C. Convert to image galleries** | Medium | If the Drive files are image collections or presentations, export each slide/page as an image and create a gallery in the new site. |
| **D. Link to Drive with note** | Low | Replace embeds with links to the Drive files, with a note that these are external resources. **Risk:** Same longevity concern as option B. |

**Recommendation:** Option A — ask the site owner (art teacher) to export the Drive content and provide the files for direct hosting on the new platform.

---

## 2. Google Sites CDN Images (lh3.googleusercontent.com)

**Affected pages:** ALL pages with images (~55 of 74 pages)  
**Severity:** MEDIUM — Solvable but requires bulk download

### Problem

All images on the site are hosted on Google's internal CDN:
```
https://lh3.googleusercontent.com/sitesv/{encoded-id}=w{width}
```

These URLs:
- Are tied to the Google Sites infrastructure
- May expire or become inaccessible if the Google Site is deleted
- Use Google-specific encoding that is not portable
- Include size parameters (`=w1280`, `=w16383`) that Google handles dynamically

### Estimated Scale

| Page Category | Pages | Avg Images/Page | Est. Total Images |
|---|---|---|---|
| Art domain galleries (خزف, زخرفة, معادن, خشب, نسيج, رسم) | ~12 | 150 | ~1,800 |
| Student portfolios (تربية خاصة) | 20 | 30 | ~600 |
| Event galleries (اليوم الوطني, إبداعات, معارض) | ~15 | 50 | ~750 |
| Other galleries (جوائز, بحوث, مشروعات) | ~5 | 50 | ~250 |
| **Total estimated** | | | **~3,400** |

### Recommended Solution

Write a bulk image download script that:
1. Parses each page's HTML to extract all `lh3.googleusercontent.com` image URLs
2. Downloads each image at its highest resolution (strip size parameter or use `=w0` for original)
3. Saves images with descriptive filenames (e.g., `{section}/{page-slug}/{index}.jpg`)
4. Stores images in the new site's public directory or cloud storage (S3/Cloudinary)
5. Updates the database with image references

**Important:** The first image on every page (ID `AG8ngQXL7w5...`) is the shared site header/banner — skip it during content migration.

---

## 3. YouTube Video Embeds

**Affected pages:** 2 (Homepage, أخبار التربية الفنية)  
**Severity:** LOW — Straightforward to handle

### Problem

| Page | Video ID | Embed Type |
|---|---|---|
| Homepage (`/`) | `5C786iMeFXQ` | Link (not embedded player) |
| أخبار التربية الفنية | `3C6FM6bl7k8` | Embedded iframe player |

The YouTube embed on the news page uses a Google Sites-specific embed URL format:
```
https://www.youtube.com/embed/3C6FM6bl7k8?embed_config={encoded_json}&enablejsapi=1&...
```

The `embed_config` parameter contains Google Sites-specific configuration that won't work outside Google Sites.

### Recommended Solution

Extract the video ID from each YouTube URL and re-embed using standard YouTube embed format:
```html
<iframe src="https://www.youtube.com/embed/VIDEO_ID" 
        title="YouTube video player" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
</iframe>
```

Or use a React YouTube component (e.g., `react-youtube` or Next.js `<iframe>`).

**Video IDs to migrate:**
- `5C786iMeFXQ` — Homepage video (التربية الفنية binawf channel)
- `3C6FM6bl7k8` — News page embedded video

---

## 4. Empty/Placeholder Pages

**Affected pages:** 4 confirmed, possibly more among unfetched pages  
**Severity:** LOW — No content to migrate

### Confirmed Empty Pages

| Page | Title | Status |
|---|---|---|
| `/الإعلانات` | الإعلانات | Empty — title only, no announcements |
| `/دروس-التربية-الفنية` | دروس التربية الفنية | Empty — title only, no lessons |
| `/معارض-التربية-الفنية/معرض-التربية-الفنية-عام-1444-هـ` | معرض 1444 هـ | Nearly empty — title + back link only |
| `/معارض-التربية-الفنية/معرض-يوم-التأسيس-عام-١٤٤٤-هـ` | معرض يوم التأسيس 1444 هـ | Nearly empty — title + back link only |

### Recommended Solution

Create the page structure in the new site (routes, titles, navigation entries) but leave content empty. Add a note in the admin panel indicating these sections are ready for future content entry.

---

## 5. Google Sites Framework Iframes

**Affected pages:** ALL pages  
**Severity:** NONE — Framework artifacts, not content

### Problem

Every page has 3–6 iframes. Investigation shows these are Google Sites framework elements (search box, navigation toggles, etc.), not content embeds. The only page with content iframes is المعارض الافتراضية (covered in section 1).

### Recommended Solution

Ignore all framework iframes. Only migrate content-bearing iframes (YouTube embeds and Drive embeds as noted above).

---

## 6. Navigation Structure

**Severity:** LOW — Already mapped

### Problem

The Google Sites navigation is a hierarchical tree of 74 pages. The new site needs to replicate this structure.

### Recommended Solution

The navigation tree has been fully extracted (see CONTENT_INVENTORY.md). The site structure should be replicated as:
- Top-level sections → Main navigation categories
- Child pages → Sub-navigation items
- Grandchild pages → Tertiary navigation or section pages

The Prisma seed script should create all 74 pages with their parent-child relationships, titles (from H1 tags), and slugs (from URL paths).

---

## 7. Content Text Structure

**Severity:** MEDIUM — Requires per-page content extraction

### Problem

Most gallery pages consist of:
- Repeated pattern: `## [image-link]` + `Student Name / Grade` heading
- No rich text body content
- No structured data (dates, categories, tags)

The text content is embedded in the HTML structure with minimal semantic markup. Google Sites uses div-based layouts with no consistent class names.

### Recommended Solution

For each page type, create a content extraction pattern:

| Page Type | Content Pattern | Migration Approach |
|---|---|---|
| Student Gallery | H2 heading + image per entry | Extract as list of `{name, grade, imageUrl}` objects |
| Art Domain Gallery | Image grid with minimal labels | Extract as image gallery array |
| Student Portfolio | Image grid, student name as H1 | Extract as portfolio with image array |
| News | H2 headings + paragraphs + images | Extract as article with title, body, images, video |
| Index Page | Links to children only | Create from navigation tree, no content extraction needed |

---

## 8. Unfetched Pages — Risk Assessment

**43 pages were not directly fetched.** Based on structural patterns:

| Category | Pages | Risk | Reasoning |
|---|---|---|---|
| التربية الخاصة student portfolios (18 remaining) | 18 | LOW | Pattern confirmed from 2 samples — all are student portfolios with 20–45 images |
| مجال الرسم section galleries (7 remaining) | 7 | LOW | Pattern confirmed from 1 sample (الرابع/٥) — all are drawing galleries with ~150 images |
| الشارة الذهبية term pages (8 remaining) | 8 | MEDIUM | Parent pages were empty/index. Term pages may contain badge images or may also be empty. **Should be fetched before migration.** |
| اليوم الوطني year pages (3 remaining) | 3 | LOW | Pattern confirmed from 3 samples — all are student galleries |
| مجال الزخرفة sub-pages (2 remaining) | 2 | LOW | Pattern confirmed from 1 sample (الهندسية) — all are decoration galleries |
| المشروعات الفنية للصف الخامس (1 remaining) | 1 | LOW | Pattern confirmed from الصف الرابع sample |
| Index pages (4 remaining) | 4 | NONE | Confirmed pattern — header only, no content |

### Recommended Action Before Migration

**Fetch the 8 الشارة الذهبية term pages** to determine if they contain badge images or are empty. These are the only pages with meaningful uncertainty.

---

## 9. Image Quality and Formats

### Problem

Google Sites CDN serves images in WebP/JPEG format at specified widths:
- `=w1280` — 1280px wide (most content images)
- `=w16383` — very large (header banner)

The original upload format and resolution are unknown. Some images may be low-resolution phone photos.

### Recommended Solution

1. Download images at maximum available resolution (use `=w0` or remove size parameter)
2. Convert to WebP for the new site (Next.js Image component handles this)
3. Store originals as backup
4. Use Next.js `<Image>` component for responsive sizing and optimization

---

## Migration Priority Order

| Priority | Pages | Rationale |
|---|---|---|
| **P1 — Critical** | أخبار التربية الفنية (news with video), Homepage | Only pages with text articles and YouTube videos |
| **P2 — High volume** | مجال الخزف (218), الزخرفة الهندسية (209), مجال المعادن (175), مجال النسيج (138), مجال الخشب (103) | Largest image galleries — most content at stake |
| **P3 — Student work** | إبداعات الطلاب (181), all التربية الخاصة portfolios (20 pages), all مجال الرسم galleries (7 pages) | Core educational content — student artwork |
| **P4 — Events** | اليوم الوطني pages (6), معارض التربية الفنية (3), جوائز وإنجازات, بحوث ومشروعات وتقارير | Event documentation |
| **P5 — Blocked** | المعارض الافتراضية | Requires manual Google Drive content export |
| **P6 — Empty/Index** | الإعلانات, دروس التربية الفنية, all index pages | No content to migrate — create structure only |
| **P7 — Verify first** | الشارة الذهبية term pages (8) | Must fetch to determine if content exists |

---

## Summary

| Gap | Impact | Pages Affected | Solution Complexity |
|---|---|---|---|
| Google Drive embeds | Content inaccessible | 1 | Medium (manual export needed) |
| Google CDN images | ~3,400 images need download | ~55 | Medium (bulk script) |
| YouTube embeds | 2 videos need re-embedding | 2 | Low (extract video IDs) |
| Empty pages | No content to migrate | 4+ | None (create empty structure) |
| Unfetched pages | 43 pages not verified | 43 | Low (fetch + verify) |
| Content text structure | Needs per-type extraction | ~55 | Medium (pattern-based extraction) |
