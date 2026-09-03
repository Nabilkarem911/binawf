# CMS Audit & Repair Report

## نظرة عامة

تم إجراء تدقيق شامل وإصلاح كامل لنظام إدارة المحتوى (CMS) الخاص بمنصة "موهبة فنان" الفنية التعليمية لمدرسة عبدالرحمن بن عوف الابتدائية في جدة.

تم الالتزام بالمنهجية المطلوبة: **فحص → إصلاح جذري → اختبار → تحقق → إعادة اختبار**.

لم تتم إعادة كتابة المشروع، ولم تُستخدم حلول بديلة (workarounds)، ولم تُخفَ المشاكل.

---

## الإصلاحات المنجزة

### 1. إصلاح Select controls — عرض التسميات العربية بدل قيم Enum

**المشكلة:** كانت عناصر Select تعرض قيمًا خامًا مثل `PUBLISHED` و `ARTICLE` ومعرّفات الأقسام بدل التسميات العربية.

**الإصلاح:** تحديث `ContentForm.tsx` و `CategoryForm.tsx` و `NavigationForm.tsx` لاستخدام function-child form في `SelectValue` لربط القيم بالتسميات العربية.

**الملفات:**
- `components/admin/ContentForm.tsx`
- `components/admin/CategoryForm.tsx`
- `components/admin/NavigationForm.tsx`

### 2. إصلاح سلوك Select popup

**المشكلة:** القوائم الطويلة و RTL تحتاج تموضعًا وتمريرًا آمنًا.

**الإصلاح:** تحديث `components/ui/select.tsx` لتحسين:
- محاذاة نص RTL
- عرض البوب أب المتجاوب
- أقصى ارتفاع وتمرير
- تموضع آمن داخل إطار العرض

### 3. منتقي الوسائط (MediaPicker)

**الإصلاح:** إنشاء `components/admin/MediaPicker.tsx` — مكوّن قابل لإعادة الاستخدام لاختيار الوسائط في نماذج المحتوى والأقسام.

### 4. تكامل الوسائط مع نموذج المحتوى

**الإصلاح:** إضافة دعم الصورة الرئيسية (featured image) والنص البديل (alt text):
- `components/admin/ContentForm.tsx`
- `app/(admin)/admin/content/actions.ts`
- `app/(admin)/admin/content/new/page.tsx`
- `app/(admin)/admin/content/[id]/page.tsx`

### 5. تكامل الوسائط مع نموذج الأقسام

**الإصلاح:** إضافة منتقي صور الأقسام:
- `components/admin/CategoryForm.tsx`
- `app/(admin)/admin/categories/actions.ts`
- `app/(admin)/admin/categories/new/page.tsx`
- `app/(admin)/admin/categories/[id]/page.tsx`

### 6. تجربة مكتبة الوسائط — سحب وإفلات + رفع متعدد + تقدم + نسخ رابط + تحرير بيانات

**الإصلاح:** إعادة كتابة `components/admin/MediaUploadForm.tsx` بالكامل:
- منطقة سحب وإفلات
- رفع متعدد الملفات
- تقدم رفع لكل ملف (pending → uploading → success/error)
- نسخ رابط الوسائط
- تحرير النص البديل (alt) والتعليق (caption) عبر PATCH endpoint
- تصفية وبحث
- إحصائيات
- تأكيد حذف
- تحديث `app/api/media/route.ts`:
  - إضافة PATCH endpoint لتحرير alt/caption
  - إضافة فحص سلامة مرجعية قبل الحذف (يمنع حذف وسائط مستخدمة في محتوى أو أقسام)

### 7. تجريد مزود التخزين (StorageProvider)

**الإصلاح:** إنشاء `lib/storage.ts`:
- واجهة `StorageProvider`
- `LocalStorageProvider`
- مصنع `getStorageProvider()`
- دعم مستقبلي لـ S3 / Supabase / Cloudinary

### 8. خط أنابيب تعقيم HTML

**الإصلاح:** إنشاء `lib/sanitize.ts` — معقّم بدون تبعيات خارجية:
- قائمة بيضاء للوسوم والسمات الآمنة
- إزالة السكربتات والأنماط والقوالب والتعليقات
- حظر مخططات خطيرة (`javascript:`, `vbscript:`, `data:`, `file:`)
- تقييد iframes لـ YouTube/Google Drive
- تقييد خصائص CSS المضمنة
- إضافة `rel="noopener noreferrer"` للروابط
- إضافة lazy loading للصور
- `sanitizeHtml` و `sanitizeHtmlStrict`

التطبيق: `components/public/PostPage.tsx` يعقّم قبل العرض، وإجراءات المحتوى تعقّم قبل الحفظ (دفاع في عمق).

### 9. محرر نص منسّق (Rich Text Editor)

**الإصلاح:** إنشاء `components/admin/RichTextEditor.tsx` — محرر `contenteditable` مع:
- شريط أدوات تنسيق
- إدراج صور
- إدراج روابط
- رفع وإدراج عبر `/api/media`
- قيمة HTML متحكم بها

### 10. Navigation CRUD كامل + مسار جديد

**الإصلاح:**
- `app/(admin)/admin/navigation/actions.ts` — إنشاء، تحديث، حذف، تبديل ظهور، إعادة ترتيب
- `app/(admin)/admin/navigation/new/page.tsx` — مسار الإنشاء
- `app/(admin)/admin/navigation/[id]/page.tsx` — مسار التحرير
- `components/admin/NavigationForm.tsx` — نموذج عربي بالكامل

### 11. إعادة تصميم واجهة Navigation — تبويبات مواقع + شجرة

**الإصلاح:**
- `app/(admin)/admin/navigation/page.tsx` — تبويبات ترويسة/تذييل
- `components/admin/NavigationTree.tsx` — مكوّن عميل تفاعلي:
  - تبديل الظهور مع استمرار في قاعدة البيانات
  - عرض هرمي (أب → أبناء)
  - شارات الظهور
  - روابط تحرير
  - تأكيد حذف

### 12. تسميات عربية لكل أنواع المحتوى

**الإصلاح:** جميع قيم Enum في النماذج تعرض تسميات عربية:
- الحالة: منشور / مسودة / مؤرشف
- النوع: مقال / خبر / إعلان / درس / بحث / مشروع
- الموقع: ترويسة / تذييل
- الهدف: نفس النافذة / نافذة جديدة

### 13. إعادة تصميم مدير الأقسام — واجهة شجرية

**الإصلاح:**
- `app/(admin)/admin/categories/page.tsx` — بناء شجرة + فلترة المحذوف الناعم
- `components/admin/CategoryTree.tsx` — مكوّن عميل تفاعلي:
  - عرض هرمي قابل للطي/التوسيع
  - صور مصغرة للأقسام
  - عدّاد المحتوى والأقسام الفرعية
  - أزرار: تحرير، تبديل ظهور، نقل
  - حوار نقل القسم مع منع الدورات

### 14. تبديل ظهور الأقسام + استمرار في قاعدة البيانات

**الإصلاح:** إضافة `toggleCategoryVisibility` في `app/(admin)/admin/categories/actions.ts`.

### 15. منع الدورات في هرمية الأقسام (server-side)

**الإصلاح:**
- `collectDescendants` — يجمع كل الفروع بشكل تكراري
- `updateCategory` — يرفض إذا كان الأب الجديد فرعًا للقسم
- `moveCategory` — يرفض نقل قسم إلى أحد فروعه

### 16. الحذف الناعم + إعادة تأصيل الأبناء

**الإصلاح:** `deleteCategory` الآن:
- يعيد تأصيل الأبناء إلى جد الأب (أو الجذر)
- يضبط `isVisible=false` و `deletedAt=now()` بدل الحذف الصلب
- صفحة القوائم تفلتر `deletedAt: null`

### 17. فحوص سلامة مرجعية قبل الحذف

**الإصلاح:** `DELETE /api/media` الآن:
- يفحص `Post.featuredImageId`
- يفحص `Category.imageId`
- يفحص `PostMedia.mediaId`
- يرفض الحذف مع رسالة عربية واضحة ورمز 409

### 18. تجاوب الإدارة على الجوال

**التحقق:** اختبارات E2E على 375px لكل صفحات الإدارة:
- `/admin/content/new`
- `/admin/categories`
- `/admin/navigation`
- `/admin/media`

جميعها بدون تجاوز أفقي.

---

## الاختبارات

### اختبارات E2E الجديدة

ملف: `tests/e2e/cms-audit.spec.ts` — 16 اختبارًا:

1. إنشاء عنصر قائمة
2. تحرير عنصر قائمة
3. تبديل ظهور عنصر القائمة مع التحقق من الاستمرار
4. حذف عنصر قائمة
5. تبديل ظهور قسم مع التحقق من الاستمرار
6. نموذج المحتوى لا يعرض قيم Enum خام
7. نموذج القسم لا يعرض قيم Enum خام
8. رفع وسائط عبر مكتبة الوسائط
9. نموذج المحتوى يحتوي منتقي صورة رئيسية
10. نموذج القسم يحتوي منتقي صورة
11. نموذج المحتوى يحتوي محرر نص منسّق
12. مسار `/admin/navigation/new` متاح (ليس 404)
13. تجاوب الإدارة على الجوال — المحتوى (375px)
14. تجاوب الإدارة على الجوال — الأقسام (375px)
15. تجاوب الإدارة على الجوال — القوائم (375px)
16. تجاوب الإدارة على الجوال — الوسائط (375px)

### نتائج QA النهائية

| الخطوة | النتيجة |
|---|---|
| `npm run typecheck` | ✅ نجح (exit 0) |
| `npm run lint` | ✅ نجح (exit 0) |
| `npm run build` | ✅ نجح (exit 0) |
| `npx playwright test --project=chromium` | ✅ 28/28 نجح |

---

## الملفات المعدّلة/المنشأة

### مكوّنات جديدة
- `components/admin/MediaPicker.tsx`
- `components/admin/MediaUploadForm.tsx` (إعادة كتابة)
- `components/admin/RichTextEditor.tsx`
- `components/admin/CategoryTree.tsx` (جديد)
- `components/admin/NavigationTree.tsx` (جديد)

### مكوّنات محدّثة
- `components/admin/ContentForm.tsx`
- `components/admin/CategoryForm.tsx`
- `components/admin/NavigationForm.tsx`
- `components/ui/select.tsx`
- `components/public/PostPage.tsx`

### إجراءات ومسارات
- `app/(admin)/admin/categories/actions.ts` (toggle, reorder, move, soft delete, cycle prevention)
- `app/(admin)/admin/categories/page.tsx` (tree UI)
- `app/(admin)/admin/navigation/actions.ts` (CRUD, toggle, reorder)
- `app/(admin)/admin/navigation/page.tsx` (tabs + tree)
- `app/(admin)/admin/navigation/new/page.tsx` (جديد)
- `app/(admin)/admin/navigation/[id]/page.tsx` (جديد)
- `app/(admin)/admin/content/actions.ts`
- `app/(admin)/admin/content/new/page.tsx`
- `app/(admin)/admin/content/[id]/page.tsx`
- `app/(admin)/admin/categories/new/page.tsx`
- `app/(admin)/admin/categories/[id]/page.tsx`
- `app/(admin)/admin/media/page.tsx`
- `app/api/media/route.ts` (PATCH + integrity checks)

### مكتبات
- `lib/storage.ts` (جديد)
- `lib/sanitize.ts` (جديد)

### اختبارات
- `tests/e2e/cms-audit.spec.ts` (جديد — 16 اختبار)
- `tests/e2e/smoke.spec.ts` (محدّث)

---

## ما لم يُنفّذ بعد (مقترحات مستقبلية)

- الترتيب بالسحب والإفلات (drag-and-drop reorder) للأقسام والقوائم — البنية التحتية موجودة في الإجراءات الخادمة، لكن التوصيل التفاعلي للواجهة يحتاج مكتبة DnD مخصصة.
- منتقي أب شجري (Tree Combobox) للأقسام — الحالي يستخدم Select مسطح مع منع الدورات خادميًا.
- مزود تخزين سحابي فعلي (S3/Supabase/Cloudinary) — التجريد موجود، التطبيق يحتاج تكوينًا.
- اختبارات E2E للجوال (Pixel 7) — متاحة في التكوين لكن لم تُضف اختبارات CMS مخصصة لها بعد.

---

## الخلاصة

تم إكمال التدقيق والإصلاح الشامل لـ Admin CMS بنجاح. جميع المشاكل المطلوب إصلاحها عُولجت من الجذر، مع التزام صارم بعدم إعادة كتابة المشروع وعدم استخدام workarounds. جميع الاختبارات (typecheck، lint، build، Playwright) نجحت بدون انحدارات.
