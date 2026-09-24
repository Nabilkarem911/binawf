# تقرير إعادة التصميم — منصة موهبة فنان

## المشكلة

التصميم السابق كان وظيفيًا لكنه "جاف" وحكومي الطابع:
- لوحة ألوان واحدة (navy + gold) بلا تمايز بين أنواع المحتوى
- خط واحد (Tajawal) بلا هوية بصرية للعناوين
- كل قسم = عنوان + grid بطاقات متطابقة → إيقاع ممل
- Hero نصي ثابت بلا صور أو حركة أو عمق
- بطاقات الأقسام الثمانية متطابقة (جدار navy موحد)
- أقسام فارغة تظهر كمربعات "لا يوجد محتوى" ضخمة
- القوائم المنسدلة تعمل بالـ hover فقط — غير متاحة بلوحة المفاتيح
- قائمة الجوال تفتقر scroll lock / Escape / focus management
- **علة خفية:** الدرج داخل `<header>` الذي يحمل `backdrop-filter` → `fixed` كان يُحسب نسبةً للهيدر وليس viewport (الدرج كان يُقصّ إلى شريط رفيع)

## الحل — نظام تصميم جديد

### الهوية
- **خط العناوين:** Alexandria (variable، Google Fonts) — طابع هندسي حديث
- **النص:** Tajawal يبقى للقراءة
- **لوحة فنية موسّعة:** navy + gold كمرتكزات + 6 ألوان accent (teal, coral, violet, emerald, sky, rose) — كل نوع محتوى له لونه

### أدوات بصرية جديدة في `globals.css`
| الأداة | الوظيفة |
|---|---|
| `.gradient-mesh` | تدرج شبكي متعدد الألوان (violet/teal/gold على navy) |
| `.section-tint` | خلفية قسم ملوّنة خفيفة عبر `--tint` |
| `.glass` | glassmorphism للبطاقات العائمة |
| `.grain` | نسيج ضوضاء SVG خفيف (4.5% opacity) |
| `.text-gradient-gold` | عنوان بتدرج ذهبي |
| `.reveal` + `RevealOnScroll` | ظهور عند التمرير عبر IntersectionObserver (بدون مكتبات) |
| `.animate-float(-slow)` | طفو بطيء لبطاقات الـ hero |
| `.header-scroll` | ظل تدريجي للهيدر عبر `animation-timeline: scroll()` (Chromium، تحسين تدريجي) |

كل الحركات تحترم `prefers-reduced-motion`.

## الصفحة الرئيسية

| القسم | قبل | بعد |
|---|---|---|
| Hero | نص مركزي على navy + blobَين | تخطيط عمودين: نص + كولاج بطاقات عائمة لأعمال الطلاب الحقيقية من DB (fallback: بطاقات زجاجية بأيقونات)، إحصائيات حية من DB، نقاط هندسية SVG، شريط accent سفلي |
| الأقسام | 8 بطاقات navy متطابقة | كل بطاقة لون accent مختلف + أيقونة خاصة بالمجال + عدّاد محتوى + سهم يظهر عند hover |
| الأخبار | grid متطابق | خبر featured كبير (صورة كاملة + overlay) + قائمة صفوف مضغوطة |
| الإعلانات | بطاقات مربعة | بطاقات أفقية بأيقونة Megaphone على خلفية coral-tinted |
| المعارض / إبداعات الطلاب | grid متطابق | جدار صور masonry (row-span متنوعة + grid-flow-dense) |
| الإنجازات | بطاقات مسطحة | بطاقات ميداليات بأيقونات Trophy/Medal/Star وشريط ذهبي عند hover |
| CTA | navy مسطح | gradient-mesh + grain + حلقات زخرفية |
| الأقسام الفارغة | مربع "لا يوجد محتوى" ضخم | **تُخفى بالكامل** |
| المساحات | py-16/py-20 موحدة | py-12/py-16 مع تناوب خلفيات (أبيض/cream-tinted) |

**الحفاظ على CMS:** بنية `HomepageSectionRenderer` والأنواع الثمانية وإعدادات كل قسم (limit, categorySlug, cta…) لم تتغير — المشرف يتحكم بالترتيب والظهور كما كان.

## الهيدر
- `h-16 lg:h-20` → `h-14 lg:h-16` (أكثر إحكامًا)
- أول 5 روابط + قائمة "المزيد" للباقي (تتضمن مجموعات فرعية مسنّنة)
- القوائم المنسدلة: hover + **focus** + Escape للإغلاق + `aria-expanded` + إغلاق بالنقر خارجها + إعادة التركيز للزر
- بحث: pill "ابحث في الموقع…" على الشاشات الواسعة، أيقونة على الأصغر
- **إصلاح:** `truncate` على عنوان الموقع — كان يدفع الأزرار خارج الشاشة عند العناوين الطويلة (overflow حقيقي على 414px)

## قائمة الجوال
- **الإصلاح الجذري:** الدرج يُعرض عبر `createPortal(document.body)` — يهرب من containing block الذي يصنعه `backdrop-filter` على الهيدر
- `role="dialog" aria-modal="true"`
- Scroll lock للخلفية (`body overflow:hidden` + استعادة)
- Escape يغلق + يعيد التركيز لزر الهامبرغر
- Focus trap: Tab/Shift+Tab يدوران داخل الدرج، التركيز الأولي على زر الإغلاق
- `overflow-hidden` على الحاوية الثابتة (يقصّ الدرج أثناء slide-in بدل scrollbar لحظية)
- هيدر الدرج بخلفية gradient-mesh + الشعار؛ مجموعات فرعية بخط ذهبي جانبي وchevron دوّار

## صفحات أخرى
- **CategoryPage:** hero بدون صورة أصبح بانر gradient-mesh بدل نص عادي + عدّاد محتوى؛ بطاقات برفع hover
- **PostPage:** شارة القسم ملوّنة (violet)؛ بطاقات "ذو صلة" محسّنة
- **البحث:** badges ملوّنة تميّز "قسم" من اسم القسم على النتائج
- **Footer:** خط accent علوي (violet→gold→teal)

## الملفات المتغيرة
- `app/globals.css` — لوحة art + أدوات جديدة + reduced-motion
- `app/layout.tsx` — خط Alexandria
- `components/public/HomeSections.tsx` — إعادة تصميم كاملة
- `components/public/Header.tsx` — إحكام + truncate + search pill
- `components/public/DesktopNav.tsx` — **جديد**: تجميع القوائم + a11y
- `components/public/MobileNav.tsx` — portal + focus trap + scroll lock + تصميم
- `components/public/RevealOnScroll.tsx` — **جديد**
- `components/public/CategoryPage.tsx`, `PostPage.tsx`, `Footer.tsx` — صقل
- `app/(public)/search/page.tsx` — badges
- `tests/e2e/redesign.spec.ts` — **جديد**: 12 اختبار

## نتائج الاختبارات
| الفحص | النتيجة |
|---|---|
| `npm run typecheck` | ✅ 0 أخطاء |
| `npm run lint` | ✅ 0 أخطاء/تحذيرات |
| `npm run build` | ✅ ناجح |
| `npx playwright test` | ✅ **46/46** (34 سابقة + 12 جديدة) |

تغطية الاختبارات الجديدة: hero + stats، إخفاء الأقسام الفارغة، قائمة "المزيد"، dropdowns بلوحة المفاتيح + Escape، scroll lock + focus restore، الدرج على 5 مقاسات (360/375/390/414/430)، عدم وجود overflow أفقي على 6 مقاسات، RTL.

## ملاحظات متبقية
- بيانات اختبارية متراكمة في DB من اختبارات سابقة ("رابط اختبار" في القائمة، عنوان موقع معدّل) — ليست أخطاء، لكن يمكن تنظيفها بـ `npm run db:seed` عند الرغبة.
- ألوان `--art-*` معرّفة للوضع الداكن أيضًا لكن الموقع لا يفعّل dark mode حاليًا.
- عنوان الـ hero يستخدم `text-gold-light` (ذهبي صلب) بدل `text-gradient-gold` — `background-clip: text` كان يرسم كتلة ذهبية صلبة تغطي الاسم في بعض المتصفحات.

---

## ملحق — المرحلة A: الوصول (Accessibility)

### التغييرات
| العنصر | الملف | التفاصيل |
|---|---|---|
| رابط «تخطَّ إلى المحتوى» | `app/(public)/layout.tsx` | أول tab stop في الصفحة؛ ثابت خارج الشاشة وينزلق للظهور عند التركيز؛ ينقل التركيز لـ`<main id="main-content" tabIndex={-1}>` |
| صفحة 404 | `app/(public)/not-found.tsx` — **جديد** | كانت صفحة Next الافتراضية الإنجليزية؛ الآن عربية بالنمط الجديد (Alexandria + mesh + أزرار) داخل الهيدر/الفوتر — يقطعها `notFound()` من `[...slug]` |
| GalleryLightbox | `components/public/GalleryLightbox.tsx` | portal إلى `document.body` (نفس إصلاح MobileNav)، focus trap بـ Tab، تركيز أولي على زر الإغلاق، استعادة التركيز للمصغّرة عند الإغلاق، swipe باللمس (يسار=التالي بما يطابق أسهم RTL)، عدّاد `aria-live="polite"` |

### اختبارات جديدة — `tests/e2e/a11y.spec.ts` (8 اختبارات: 4 × chromium + Mobile Chrome)
- الزر يظهر عند أول Tab وينقل التركيز لـmain بعد Enter
- 404 تُرجع status 404 بالتصميم الجديد داخل chrome الموقع
- Lightbox: التركيز يدخل للزر الإغلاق، الأسهم تتنقل RTL-صحيح، Tab محصور، Escape يغلق ويعيد التركيز للمصغّرة، scroll lock يتحرر
- swipe يسار/يمين يتنقل بين الصور
- الاختبارات تزرع معرضًا مؤقتًا (post + 3 media + post_media) عبر `pg` وتنظفه بعدها — لا تعتمد على بيانات موجودة

### إصلاح بنية تحتية للاختبارات
`smoke.spec.ts` كان يسجّل دخولًا جديدًا في كل اختبار ⇒ يستنزف rate limiter (10 محاولات/15 دقيقة) ويفشل تحت الحمل. طُبّق نمط إعادة الكوكيز الموجود في `cms-audit.spec.ts`.

### النتائج
`typecheck` ✅ · `lint` ✅ · `build` ✅ · Playwright **100/100** ✅

### ملاحظات
- الـlightbox لم يعد يعتمد على موقعه في شجرة DOM (portal) — محمي من أي `transform`/`backdrop-filter` مستقبلي على السلف.
- العداد أصبح نصًا عربيًا كاملًا («صورة X من Y») بدل `X / Y` — أوضح لقارئات الشاشة.

---

## ملحق — المرحلة B: تحسين الصور

### التغييرات
| العنصر | الملف | التفاصيل |
|---|---|---|
| اعتمادية `sharp` | `package.json` | `sharp@0.35.4` أصبح dep مباشرة (كانت transitive) — مطلوبة لمحسّن `next/image` في `next start` |
| تفعيل المُحسّن | `next.config.ts` | حذف `unoptimized: true` + `localPatterns: [{pathname:'/api/media'}, {pathname:'/uploads/**'}]` — إلزامي في Next 16 لأن روابط الوسائط تحمل query string (`?filename=`)، وبدونه كل الصور تُرجع 400 |

### قرارات موثّقة
- **GIF المتحركة**: لا تحتاج معالجة خاصة — مُحسّن Next يكتشف الصور المتحركة (`is-animated` في `image-optimizer.js`) ويقدّمها كما هي دون تحسين. تحقق تجريبي: رابط gif عبر المُحسّن ⇒ 200.
- **الصور الموجودة**: لا ترحيل — كل صورة قديمة تُخدم عبر `/api/media` وتُحسَّن تلقائيًا رجعيًا (webp بأحجام srcset).
- **مكوّنات الأدمن** تبقى `unoptimized` per-image — معاينة فورية، عبء تحسين لا داعي له.

### اختبارات جديدة — `tests/e2e/images.spec.ts` + `helpers.ts`
- مصغّرات المعرض تُخدم عبر `/_next/image` بـsrcset متعدد وتُفكّ ترميزها (`img.decode()`)
- المُحسّن يتفاوض على `image/webp` مع Accept
- `/api/media` الأصلي يقدّم الملف كما هو (حماية الموجود)
- صورة الـlightbox الكبيرة محسّنة أيضًا
- ملاحظة تقنية: `naturalWidth` **غير صالح للتحقق** مع صور `srcset` بـw-descriptors (كل صور `next/image`) — القيمة مصحّحة بالكثافة حسب المواصفة (`intrinsicWidth ÷ density`)، فتُرجع أقل من العرض الحقيقي، وعلى مصادر 1×1 تُقرّب إلى **0** رغم أن الصورة تُفكّ ترميزها وتُرسَم سليمة. تحقّق تجريبي: نفس الرابط عبر `new Image()` ⇒ 400، وعبر عنصر DOM ⇒ 264؛ إزالة `content-disposition`/`content-security-policy` لا تغيّر شيئًا (ليس خللًا في المُحسّن أو المتصفح). الاختبار يعتمد `img.decode()` + فحص الشبكة بدلًا منه
- الزرع المشترك انتقل إلى `tests/e2e/helpers.ts` (تستخدمه a11y + images) — يولّد PNG حقيقي 400×300 عبر sharp وينظّف بعد الاختبار

### مخاطر/ملاحظات للإنتاج
- كاش المُحسّن `.next/cache/images` داخل الحاوية مؤقت — يُعاد التوليد بعد كل deploy (مقبول؛ يمكن volume مخصص لاحقًا).
- المُحسّن يضيف `content-disposition: attachment` على استجاباته — لا يؤثر على `<img>` لكن يمنع التصفح المباشر لرابط المُحسّن (سلوك Next 16 الافتراضي، حماية إضافية).
- أول طلب لكل حجم صورة = fetch داخلي + resize بـsharp — تأخير لمرة واحدة ثم يُخزَّن مؤقتًا.

### النتائج
`typecheck` ✅ · `lint` ✅ · `build` ✅ · Playwright **108/108** ✅ (100 سابقة + 8 جديدة للصور)

---

## ملحق — المرحلة C: الكاش وإبطال المحتوى

### التغييرات
| العنصر | الملف | التفاصيل |
|---|---|---|
| كاش طبقة البيانات | `lib/site.ts` | `getSiteSettings` + `getHeaderNavigation` + `getHomepageSections` ملفوفة بـ`unstable_cache` بوسم `public` + `revalidate: 3600` (شبكة أمان). تخدم كل طلب عام (الهيدر/الفوتر/الرئيسية) بدون استعلامات DB متكررة |
| موجّه الإبطال | `lib/cache.ts` **جديد** | `revalidatePublic()` = `revalidatePath("/", "layout")` (يمسح كاش كل الصفحات العامة + الهيدر/الفوتر) + `revalidateTag("public", {expire: 0})` (يمسح إدخالات unstable_cache فورًا، بلا تقديم قديم) |
| ISR للمسار الديناميكي | `app/(public)/[...slug]/page.tsx` | `revalidate = 60` + `generateStaticParams() { return [] }` — **Next 16 يشترط وجود GSP لتفعيل كاش المخرجات على المسارات الديناميكية**؛ المصفوفة الفارغة تعني صفر prerender وقت البناء (لا حاجة لـDB أثناء `docker build`)، والمسارات غير المعروفة تُبنى عند أول طلب وتُخزَّن 60 ثانية |
| تغطية الإبطال | 5 ملفات actions + `api/media` PATCH | كل تعديلات CMS (تصنيفات/محتوى/رئيسية/قوائم/إعدادات) + تعديل alt/caption للوسائط تستدعي `revalidatePublic()` — حلّت ثغرة كانت موجودة في `PATCH /api/media` الذي لم يبطّل شيئًا |

### قرارات موثّقة
- **`unstable_cache` يُسلسل النتائج بـ`JSON.stringify`** (تحقق من `unstable-cache.js:24`) — الدوال المخزّنة تستخدم `select` يقتصر على حقول scalar فقط، بلا أعمدة `Date` (كانت ستعود strings بعد الكاش وتكسر `formatHijriDate` أو نوع `HomepageSection`). نوع `SectionProps` في `HomeSections.tsx` يوثّق ذلك.
- **الرئيسية تبقى `force-dynamic`**: ISR على `/` يعني prerender وقت البناء = انهيار `docker build` (لا DB). لكن استعلاماتها صارت رخيصة عبر كاش البيانات.
- **`/search` و`/sitemap.xml` وكل `/admin`** يبقون ديناميكيين — نتائج لكل استعلام وصفحات حساسة بالكوكيز.
- استعلامات المحتوى داخل أقسام الرئيسية (أحدث مقالات/معارض) بقيت غير مخزّنة — تحمل حقول `Date` وتحتاج حداثة فورية؛ الكلفة المتبقية محدودة (استعلامات خفيفة على صفحة واحدة).

### اختبارات جديدة — `tests/e2e/cache.spec.ts` (+ `adminLogin`/`updatePostTitle` في `helpers.ts`)
- إنشاء عنصر قائمة عبر الأدمن ⇒ يظهر في هيدر الموقع فورًا؛ حذفه ⇒ يختفي (يثبت إبطال unstable_cache + كاش الـlayout)
- صفحة مقال: زيارة ⇒ تُخزَّن؛ تعديل العنوان مباشرة في DB ⇒ إعادة التحميل تقدّم **العنوان القديم** (يثبت ISR فعليًا)؛ ثم `PATCH /api/media` ⇒ الزيارة التالية تقدّم العنوان الجديد + الـalt الجديد (يثبت الإبطال الفوري وتغطية PATCH)
- تنظيف احتياطي `finally` يمنع تسرب عناصر اختبار إلى بقية السويت

### مخاطر/ملاحظات
- **سلوك Next 16 الجديد**: `revalidate` وحده على مسار ديناميكي لا يكاشش شيئًا — ISR يتطلب `generateStaticParams` (حتى فارغة). اكتُشف بالاختبار الفاشل الذي أظهر المحتوى المحدّث فورًا، وأُثبت بالتوثيق المرفق ونتيجة الاختبار بعد الإصلاح.
- عتبة الإبطال صفر-سماحية (`expire: 0`) — أي كتابة CMS تُظهر التعديل فورًا بلا نافذة قديمة؛ مثالي لمحتوى مدرسة منخفض الكتابة.
- مشكلة بنية تحتية وُجدت أثناء التشغيل: عناصر قائمة اختبارية قديمة (Sept) بروابط ميتة كانت تلوّث الهيدر وتكسر اختبار نظافة الشبكة — أُزيلت من قاعدة التطوير.

### النتائج
`typecheck` ✅ · `lint` ✅ · `build` ✅ (`/[...slug]` ⇒ `● SSG`) · Playwright **112/112** ✅ (108 سابقة + 4 جديدة للكاش)
