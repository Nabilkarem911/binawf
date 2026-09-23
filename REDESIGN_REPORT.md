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
