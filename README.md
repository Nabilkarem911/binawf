# موهبة فنان — منصة التربية الفنية

منصة إدارة محتوى كاملة لمدرسة عبد الرحمن بن عوف الابتدائية بجدة، تحل محل موقع Google Sites القديم.

## المتطلبات

- Node.js 20+
- PostgreSQL 14+ (محلي أو Docker)
- npm 10+

## التشغيل السريع

1. نسخ `.env.example` إلى `.env` (أو إنشاء `.env`) وتعبئة القيم:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/binawf_db"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
SESSION_SECRET="change-this-to-a-long-random-string"
ADMIN_EMAIL="admin@binawf.local"
ADMIN_PASSWORD="Binawf2026!"
```

2. تثبيت الاعتمادات:

```bash
npm install
```

3. إنشاء قاعدة البيانات وتطبيق المigrations والبذور:

```bash
npx prisma migrate dev
npx prisma db seed
```

4. تشغيل وضع التطوير أو اختبارات المتصفح:

```bash
npm run dev        # خادم التطوير
npm run start      # خادم الإنتاج (بعد npm run build)
npm run test       # اختبارات Playwright (يتطلب خادماً يعمل على 3000)
```

5. فتح `http://localhost:3000`.

## الأوامر المتاحة

- `npm run dev` — تشغيل الخادم المحلي.
- `npm run build` — بناء إصدار الإنتاج.
- `npm run start` — تشغيل الإنتاج.
- `npm run lint` — تشغيل ESLint.
- `npm run db:generate` — توليد عميل Prisma.
- `npm run db:migrate` — تطبيق migrations.
- `npm run db:seed` — تعبئة البيانات الأولية.
- `npm run db:studio` — فتح Prisma Studio.

## لوحة التحكم

- الرابط: `http://localhost:3000/admin`
- البريد الافتراضي: `admin@binawf.local`
- كلمة المرور الافتراضية: `Binawf2026!`
- بعد تسجيل الدخول يمكن إدارة:
  - المحتوى (مقالات، أخبار، إعلانات، دروس، مشاريع، معارض، ...)
  - الأقسام والتصنيفات الهرمية
  - الوسائط (الصور والفيديو)
  - إعدادات الموقع

## البنية

```
app/
  (public)/          # الموقع العام (الرئيسية، الأقسام، البحث)
  (admin)/admin/     # لوحة التحكم
  api/               # نقاط API للدخول والوسائط
components/
  public/            # مكونات الموقع العام
  admin/             # نماذج وعناصر لوحة التحكم
prisma/              # مخطط Prisma والبذور
public/uploads/      # ملفات مرفوعة محلياً
```

## الميزات

- تصميم RTL بالكامل مع خط عربي.
- تصنيفات هرمية غير محدودة.
- أنواع محتوى متعددة: أخبار، إعلانات، دروس، مشاريع، بحوث، جوائز، معارض، معارض افتراضية، إنجازات، فعاليات.
- صفحات ديناميكية لكل قسم ومقال.
- محرك بحث محلي.
- sitemap.xml و robots.txt تلقائيان.
- رفع الوسائط (صور/فيديو) مع عارض بسيط.
- إدارة الترتيب والظهور في القائمة.
- تفويض آمن بواسطة iron-session وتجزئة bcrypt.

## ما تم ترحيله من Google Sites

- تم ترحيل بنية التنقل الكاملة والأقسام الهرمية.
- تم إنشاء تصنيفات وأقسام بأسمائها الأصلية.
- لم يتم ترحيل جسم الصفحات والصور/الملفات/مقاطع الفيديو المدمجة تلقائياً لأن Google Sites لا يوفر واجهة برمجية عامة لاستخراجها.
- المسؤول عن الموقع يمكنه إضافة المحتوى والوسائط عبر لوحة التحكم الجديدة.

## النشر على أي سيرفر (إنتاج) — Docker Compose

الملف `docker-compose.yml` بيشغّل الموقع + PostgreSQL معاً على أي سيرفر فيه Docker — من غير أي اعتماد على Dokploy أو Vercel.

```bash
cp .env.example .env        # ثم عدّل القيم الفاضية (انظر أدناه)
openssl rand -hex 32        # → SESSION_SECRET
openssl rand -base64 18     # → ADMIN_PASSWORD
openssl rand -hex 16        # → POSTGRES_PASSWORD
docker compose up -d --build
```

- الموقع على `http://SERVER_IP:3000` (غيّر `PORT` في `.env` لو حابب).
- الرفعات بتتحفظ في volume باسم `uploads` والبيانات في `dbdata` — **بتفضل بعد أي redeploy/restart**.
- أي سيرفر PaaS بيقرا compose (Dokploy/Coolify/CapRover) يشتغل معاه — الداتابيز جوه الشبكة الداخلية مش مكشوفة.

### تركيب مباشر على Node (من غير Docker)

```bash
npm ci
cp .env.example .env   # وضبط DATABASE_URL على postgres خارجي + SESSION_SECRET + ADMIN_*
npx prisma migrate deploy
npx prisma db seed     # أول مرة فقط
npm run build
npm run start          # على المنفذ 3000
```

## الأمان (إلزامي في الإنتاج)

الـ entrypoint بيفشل التشغيل **عمداً** في وضع الإنتاج لو:
- `SESSION_SECRET` ناقص أو أقل من 32 حرف.
- `ADMIN_PASSWORD` ناقص، أو أقل من 12 حرف، أو مساوي للقيمة الافتراضية الموثقة `Binawf2026!` (على قاعدة فاضية).

إجراءات أمان مدمجة:
- تسجيل الدخول محمي بـ **rate limiting** (10 محاولات / 15 دقيقة لكل IP).
- الرفع محصور بأنواع معينة فقط (PNG/JPG/GIF/WebP/MP4/PDF) مع فحص **magic bytes** وحد أقصى للحجم (25MB افتراضياً عبر `MAX_UPLOAD_MB`) — **ممنوع SVG/HTML/executables** (حماية من stored XSS).
- ترويسات أمان (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`).
- التطبيق شغال كمستخدم غير root داخل الحاوية مع `no-new-privileges`.
- كلمة مرور المدير مخزنة كـ bcrypt؛ غيّرها بعد أول دخول من الإعدادات.

قبل ما تفتح الموقع للجمهور: غيّر `SESSION_SECRET` و `ADMIN_PASSWORD`، ولو حطيت الرفعات على volume اعمل **نسخة احتياطية دورية للـ DB** (`pg_dump` أو snapshot من منصة الاستضافة).

### حدود معروفة
- المحتوى بيُدخل كـ HTML خام من لوحة التحكم (مفيش WYSIWYG بعد) — **ممنح صلاحية التحرير لناس موثوقين فقط**.
- الرفعات محلية على volume (مش S3/CDN) — مناسبة للاستخدام المدرسي؛ للتحميل العالي بدّلها بتخزين كائنات.
- rate limiting في الذاكرة — لو شغّلت أكثر من نسخة (multi-instance) محتاج Redis.

## ملاحظات الإنتاج

- غيّر `SESSION_SECRET` إلى سلسلة عشوائية طويلة.
- غيّر كلمة مرور المدير فور أول دخول.
- استخدم رابط PostgreSQL الإنتاجي في `DATABASE_URL`.
- للاستضافة على Vercel أو Netlify أو أي خادم Node.js، شغّل `npm run build` ثم `npm run start`.
- للملفات المرفوعة في الإنتاج، يُفضل تبديل `public/uploads` بتخزين كائنات S3/CDN.
