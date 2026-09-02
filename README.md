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

4. تشغيل وضع التطوير:

```bash
npm run dev
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

## ملاحظات الإنتاج

- غيّر `SESSION_SECRET` إلى سلسلة عشوائية طويلة.
- غيّر كلمة مرور المدير فور أول دخول.
- استخدم رابط PostgreSQL الإنتاجي في `DATABASE_URL`.
- للاستضافة على Vercel أو Netlify أو أي خادم Node.js، شغّل `npm run build` ثم `npm run start`.
- للملفات المرفوعة في الإنتاج، يُفضل تبديل `public/uploads` بتخزين كائنات S3/CDN.
