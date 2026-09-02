import "dotenv/config";
import { PrismaClient, PostType, PostStatus, UserRole, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@binawf.local";
  const password = process.env.ADMIN_PASSWORD ?? "Binawf2026!";
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return exists;

  return prisma.user.create({
    data: {
      email,
      name: "مدير الموقع",
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
    },
  });
}

type CategoryInput = {
  title: string;
  slug: string;
  description?: string;
  type?: PostType;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
  children?: CategoryInput[];
};

const topCategories: CategoryInput[] = [
  {
    title: "التربية الخاصة",
    slug: "special-education",
    description: "إنجازات وإبداعات طلاب التربية الخاصة.",
    type: PostType.ARTICLE,
    sortOrder: 10,
    children: [
      { title: "باسل الراشدي / الصف الخامس", slug: "basel-al-rashidi", description: "أعمال الطالب باسل الراشدي - الصف الخامس." },
      { title: "عبدالله الغامدي / الصف الأول", slug: "abdullah-al-ghamdi-1", description: "أعمال الطالب عبدالله الغامدي - الصف الأول." },
      { title: "إسماعيل بخاري / الصف الثالث", slug: "ismail-bukhari-3", description: "أعمال الطالب إسماعيل بخاري - الصف الثالث." },
      { title: "عبدالرحمن محمد / الصف الرابع", slug: "abdulrahman-mohammed-4", description: "أعمال الطالب عبدالرحمن محمد - الصف الرابع." },
      { title: "محمد العمودي / الصف الأول", slug: "mohammed-al-amoudi-1", description: "أعمال الطالب محمد العمودي - الصف الأول." },
      { title: "باسل إدريس / الصف الرابع", slug: "basel-idris-4", description: "أعمال الطالب باسل إدريس - الصف الرابع." },
      { title: "أنس اليوبي / الصف الخامس", slug: "anas-al-youbi-5", description: "أعمال الطالب أنس اليوبي - الصف الخامس." },
      { title: "تركي بخاري / الصف الرابع", slug: "turki-bukhari-4", description: "أعمال الطالب تركي بخاري - الصف الرابع." },
      { title: "حاتم السلمي / الصف الخامس", slug: "hatem-al-salmi-5", description: "أعمال الطالب حاتم السلمي - الصف الخامس." },
      { title: "رياض العبيدي / الصف الرابع", slug: "riyad-al-obaidi-4", description: "أعمال الطالب رياض العبيدي - الصف الرابع." },
      { title: "سلطان الغانمي / الصف الثالث", slug: "sultan-al-ghanmi-3", description: "أعمال الطالب سلطان الغانمي - الصف الثالث." },
      { title: "عبدالعزيز شيخ / الصف الرابع", slug: "abdulaziz-sheikh-4", description: "أعمال الطالب عبدالعزيز شيخ - الصف الرابع." },
      { title: "عبدالله الخميسي / الصف الثالث", slug: "abdullah-al-khamsi-3", description: "أعمال الطالب عبدالله الخميسي - الصف الثالث." },
      { title: "تركي الكناني", slug: "turki-al-kanani", description: "أعمال الطالب تركي الكناني." },
      { title: "هشام النصيرات", slug: "hisham-al-nusairat", description: "أعمال الطالب هشام النصيرات." },
      { title: "عابد عبد الكريم", slug: "abed-abdulkarim", description: "أعمال الطالب عابد عبد الكريم." },
      { title: "منصور طربيه", slug: "mansour-tarbiah", description: "أعمال الطالب منصور طربيه." },
      { title: "عمران اليوبي", slug: "imran-al-youbi", description: "أعمال الطالب عمران اليوبي." },
      { title: "محمد طه عبدالله", slug: "mohammed-taha-abdullah", description: "أعمال الطالب محمد طه عبدالله." },
      { title: "همام النفيعي", slug: "hammam-al-nufeiei", description: "أعمال الطالب همام النفيعي." },
    ],
  },
  {
    title: "المشروعات الفنية",
    slug: "art-projects",
    description: "المشروعات الفنية للصفوف الدراسية.",
    type: PostType.PROJECT,
    sortOrder: 20,
    children: [
      { title: "المشروعات الفنية للصف الرابع", slug: "art-projects-grade-4", description: "مشروعات طلاب الصف الرابع." },
      { title: "المشروعات الفنية للصف الخامس", slug: "art-projects-grade-5", description: "مشروعات طلاب الصف الخامس." },
    ],
  },
  {
    title: "مجال الرسم",
    slug: "drawing-field",
    description: "أعمال ودروس مجال الرسم.",
    type: PostType.LESSON,
    sortOrder: 30,
    children: [
      {
        title: "الصف الرابع",
        slug: "drawing-grade-4",
        children: [
          { title: "الرابع / ٥", slug: "drawing-grade-4-5" },
          { title: "الرابع / ٦", slug: "drawing-grade-4-6" },
          { title: "الرابع / ٧", slug: "drawing-grade-4-7" },
        ],
      },
      {
        title: "الصف الخامس",
        slug: "drawing-grade-5",
        children: [
          { title: "الخامس / ١", slug: "drawing-grade-5-1" },
          { title: "الخامس / ٢", slug: "drawing-grade-5-2" },
          { title: "الخامس / ٣", slug: "drawing-grade-5-3" },
          { title: "الخامس / ٤", slug: "drawing-grade-5-4" },
        ],
      },
    ],
  },
  {
    title: "مجال الخزف",
    slug: "ceramics",
    description: "أعمال ودروس مجال الخزف.",
    type: PostType.LESSON,
    sortOrder: 40,
  },
  {
    title: "مجال الزخرفة",
    slug: "decoration",
    description: "أعمال ودروس مجال الزخرفة.",
    type: PostType.LESSON,
    sortOrder: 50,
    children: [
      { title: "الزخرفة الهندسية", slug: "geometric-decoration" },
      { title: "الزخرفة النباتية", slug: "plant-decoration" },
      { title: "الزخرفة الكتابية", slug: "calligraphy-decoration" },
    ],
  },
  {
    title: "الشارة الذهبية",
    slug: "golden-badge",
    description: "شارات التميز الذهبية لعامول دراسية متعددة.",
    type: PostType.ACHIEVEMENT,
    sortOrder: 60,
    children: [
      {
        title: "الشارة الذهبية لعام ١٤٤٣ هـ",
        slug: "golden-badge-1443",
        metadata: { hijriYear: 1443 },
        children: [
          { title: "الفصل الدراسي الأول", slug: "golden-badge-1443-term-1", metadata: { term: 1 } },
          { title: "الفصل الدراسي الثاني", slug: "golden-badge-1443-term-2", metadata: { term: 2 } },
          { title: "الفصل الدراسي الثالث", slug: "golden-badge-1443-term-3", metadata: { term: 3 } },
        ],
      },
      {
        title: "الشارة الذهبية لعام ١٤٤٥ هـ",
        slug: "golden-badge-1445",
        metadata: { hijriYear: 1445 },
        children: [
          { title: "الفصل الدراسي الأول", slug: "golden-badge-1445-term-1", metadata: { term: 1 } },
          { title: "الفصل الدراسي الثاني", slug: "golden-badge-1445-term-2", metadata: { term: 2 } },
          { title: "الفصل الدراسي الثالث", slug: "golden-badge-1445-term-3", metadata: { term: 3 } },
        ],
      },
      {
        title: "الشارة الذهبية لعام ١٤٤٧ هـ",
        slug: "golden-badge-1447",
        metadata: { hijriYear: 1447 },
        children: [
          { title: "الفصل الدراسي الأول", slug: "golden-badge-1447-term-1", metadata: { term: 1 } },
          { title: "الفصل الدراسي الثاني", slug: "golden-badge-1447-term-2", metadata: { term: 2 } },
        ],
      },
    ],
  },
  { title: "الإعلانات", slug: "announcements", description: "إعلانات التربية الفنية.", type: PostType.ANNOUNCEMENT, sortOrder: 70 },
  { title: "أخبار التربية الفنية", slug: "art-education-news", description: "آخر أخبار التربية الفنية بالمدرسة.", type: PostType.NEWS, sortOrder: 80 },
  { title: "بحوث ومشروعات وتقارير", slug: "research-reports", description: "بحوث ومشروعات وتقارير التربية الفنية.", type: PostType.RESEARCH, sortOrder: 90 },
  { title: "مجال المعادن", slug: "metals", description: "أعمال ودروس مجال المعادن.", type: PostType.LESSON, sortOrder: 100 },
  { title: "مجال الخشب", slug: "wood", description: "أعمال ودروس مجال الخشب.", type: PostType.LESSON, sortOrder: 110 },
  { title: "مجال النسيج", slug: "textile", description: "أعمال ودروس مجال النسيج.", type: PostType.LESSON, sortOrder: 120 },
  { title: "المعارض الافتراضية", slug: "virtual-exhibitions", description: "المعارض الفنية الافتراضية.", type: PostType.VIRTUAL_EXHIBITION, sortOrder: 130 },
  {
    title: "معارض التربية الفنية",
    slug: "art-exhibitions",
    description: "معارض التربية الفنية عبر السنوات.",
    type: PostType.GALLERY,
    sortOrder: 140,
    children: [
      { title: "معرض التربية الفنية عام 1444 هـ", slug: "art-exhibition-1444", metadata: { hijriYear: 1444 } },
      { title: "معرض يوم التأسيس عام ١٤٤٤ هـ", slug: "founding-day-exhibition-1444", metadata: { hijriYear: 1444, event: "founding-day" } },
      { title: "معرض التربية الفنية عام ١٤٣٩-١٤٤٠ هـ", slug: "art-exhibition-1439-1440", metadata: { hijriYearFrom: 1439, hijriYearTo: 1440 } },
    ],
  },
  { title: "إبداعات الطلاب", slug: "student-creations", description: "إبداعات طلاب التربية الفنية.", type: PostType.GALLERY, sortOrder: 150 },
  { title: "دروس التربية الفنية", slug: "art-lessons", description: "دروس التربية الفنية.", type: PostType.LESSON, sortOrder: 160 },
  { title: "جوائز وإنجازات", slug: "awards-achievements", description: "جوائز وإنجازات التربية الفنية.", type: PostType.AWARD, sortOrder: 170 },
  {
    title: "اليوم الوطني",
    slug: "national-day",
    description: "فعاليات اليوم الوطني.",
    type: PostType.EVENT,
    sortOrder: 180,
    children: [
      { title: "اليوم الوطني ٩٠", slug: "national-day-90", metadata: { nationalDay: 90 } },
      { title: "اليوم الوطني ٩١", slug: "national-day-91", metadata: { nationalDay: 91 } },
      { title: "اليوم الوطني ٩٢", slug: "national-day-92", metadata: { nationalDay: 92 } },
      { title: "اليوم الوطني ٩٣", slug: "national-day-93", metadata: { nationalDay: 93 } },
      { title: "اليوم الوطني ٩٤", slug: "national-day-94", metadata: { nationalDay: 94 } },
      { title: "اليوم الوطني ٩٥", slug: "national-day-95", metadata: { nationalDay: 95 } },
    ],
  },
];

async function upsertCategory(input: CategoryInput, parentId: string | null = null, order: number = 0) {
  const category = await prisma.category.upsert({
    where: { slug: input.slug },
    create: {
      title: input.title,
      slug: input.slug,
      description: input.description ?? `قسم ${input.title}`,
      contentType: input.type ?? PostType.ARTICLE,
      parentId,
      sortOrder: input.sortOrder ?? order,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    update: {
      title: input.title,
      description: input.description ?? `قسم ${input.title}`,
      contentType: input.type ?? PostType.ARTICLE,
      parentId,
      sortOrder: input.sortOrder ?? order,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  if (input.children) {
    for (let i = 0; i < input.children.length; i++) {
      await upsertCategory(input.children[i], category.id, (i + 1) * 10);
    }
  }

  return category;
}

async function seedCategories(adminId: string) {
  for (let i = 0; i < topCategories.length; i++) {
    await upsertCategory(topCategories[i], null, (i + 1) * 10);
  }

  // Create a welcome news post and a system announcement (real project content)
  const welcomeNews = {
    catSlug: "art-education-news",
    title: "إطلاق الموقع الجديد لموهبة فنان",
    slug: "new-website-launch",
    content: `<p>يسعدنا الإعلان عن إطلاق الموقع الجديد لبرنامج موهبة فنان للتربية الفنية بمدرسة عبد الرحمن بن عوف الابتدائية بجدة.</p><p>الموقع الجديد يتيح متابعة أخبار التربية الفنية، ومعارض الطلاب، والدروس، والجوائز، والإنجازات بشكل أسرع وأكثر احترافية.</p>`,
    type: PostType.NEWS,
  };
  const welcomeAnnouncement = {
    catSlug: "announcements",
    title: "الموقع تحت التحديث المستمر",
    slug: "site-under-update",
    content: `<p>سيتم نقل محتوى موقع موهبة فنان القديم تدريجياً إلى المنصة الجديدة. ندعو الزوار لمتابعة الأقسام المختلفة وإدارة الموقع لإضافة المحتوى الجديد.</p>`,
    type: PostType.ANNOUNCEMENT,
  };

  for (const item of [welcomeNews, welcomeAnnouncement]) {
    const category = await prisma.category.findUnique({ where: { slug: item.catSlug } });
    if (!category) continue;

    await prisma.post.upsert({
      where: {
        slug_categoryId: { slug: item.slug, categoryId: category.id },
      },
      create: {
        title: item.title,
        slug: item.slug,
        excerpt: item.content.replace(/<[^>]*>/g, "").slice(0, 160),
        content: item.content,
        type: item.type,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: adminId,
        categoryId: category.id,
        metaTitle: item.title,
        metaDescription: item.content.replace(/<[^>]*>/g, "").slice(0, 160),
      },
      update: {},
    });
  }
}

async function seedNavigation() {
  // Clear existing header nav and recreate with grouped structure
  await prisma.navigationItem.deleteMany({ where: { location: "HEADER" } });

  type NavChild = { title: string; url: string; sortOrder: number };
  type NavGroup = { title: string; url: string; sortOrder: number; children?: NavChild[] };

  const navItems: NavGroup[] = [
    { title: "الرئيسية", url: "/", sortOrder: 10 },
    {
      title: "المجالات الفنية",
      url: "/drawing-field",
      sortOrder: 20,
      children: [
        { title: "مجال الرسم", url: "/drawing-field", sortOrder: 10 },
        { title: "مجال الخزف", url: "/ceramics", sortOrder: 20 },
        { title: "مجال الزخرفة", url: "/decoration", sortOrder: 30 },
        { title: "مجال المعادن", url: "/metals", sortOrder: 40 },
        { title: "مجال الخشب", url: "/wood", sortOrder: 50 },
        { title: "مجال النسيج", url: "/textile", sortOrder: 60 },
      ],
    },
    {
      title: "المحتوى",
      url: "/art-education-news",
      sortOrder: 30,
      children: [
        { title: "أخبار التربية الفنية", url: "/art-education-news", sortOrder: 10 },
        { title: "الإعلانات", url: "/announcements", sortOrder: 20 },
        { title: "دروس التربية الفنية", url: "/art-lessons", sortOrder: 30 },
        { title: "بحوث ومشروعات وتقارير", url: "/research-reports", sortOrder: 40 },
      ],
    },
    {
      title: "المعارض",
      url: "/art-exhibitions",
      sortOrder: 40,
      children: [
        { title: "معارض التربية الفنية", url: "/art-exhibitions", sortOrder: 10 },
        { title: "المعارض الافتراضية", url: "/virtual-exhibitions", sortOrder: 20 },
        { title: "إبداعات الطلاب", url: "/student-creations", sortOrder: 30 },
      ],
    },
    {
      title: "الإنجازات",
      url: "/golden-badge",
      sortOrder: 50,
      children: [
        { title: "الشارة الذهبية", url: "/golden-badge", sortOrder: 10 },
        { title: "جوائز وإنجازات", url: "/awards-achievements", sortOrder: 20 },
        { title: "المشروعات الفنية", url: "/art-projects", sortOrder: 30 },
      ],
    },
    { title: "التربية الخاصة", url: "/special-education", sortOrder: 60 },
    { title: "اليوم الوطني", url: "/national-day", sortOrder: 70 },
  ];

  for (const item of navItems) {
    const parent = await prisma.navigationItem.create({
      data: { title: item.title, url: item.url, sortOrder: item.sortOrder, location: "HEADER" },
    });
    if (item.children) {
      for (const child of item.children) {
        await prisma.navigationItem.create({
          data: { ...child, parentId: parent.id, location: "HEADER" },
        });
      }
    }
  }
}

async function seedHomepageSections() {
  await prisma.homepageSection.deleteMany();

  await prisma.homepageSection.createMany({
    data: [
      { title: "الشعار الترحيبي", type: "HERO", sortOrder: 10, isVisible: true, settings: { title: "موهبة فنان", subtitle: "التربية الفنية بمدرسة عبد الرحمن بن عوف الابتدائية بجدة — حيث يلتقي الإبداع بالتعلم", cta: "/art-exhibitions", ctaLabel: "استكشف المعارض", secondaryCta: "/art-education-news", secondaryCtaLabel: "آخر الأخبار" } },
      { title: "الأقسام الرئيسية", type: "FEATURED_CATEGORIES", sortOrder: 20, isVisible: true, subtitle: "استكشف مجالات التربية الفنية المختلفة", settings: {} },
      { title: "أخبار التربية الفنية", type: "LATEST_NEWS", sortOrder: 30, isVisible: true, subtitle: "آخر مستجدات وأنشطة التربية الفنية", settings: { limit: 5, categorySlug: "art-education-news" } },
      { title: "الإعلانات", type: "ANNOUNCEMENTS", sortOrder: 40, isVisible: true, subtitle: "تنبيهات ومعلومات مهمة", settings: { limit: 4, categorySlug: "announcements" } },
      { title: "معارض التربية الفنية", type: "GALLERIES", sortOrder: 50, isVisible: true, subtitle: "معارض أعمال الطلاب عبر السنوات", settings: { limit: 6, categorySlug: "art-exhibitions" } },
      { title: "إبداعات الطلاب", type: "STUDENT_WORK", sortOrder: 60, isVisible: true, subtitle: "أعمال فنية مبدعة من طلاب المدرسة", settings: { limit: 6, categorySlug: "student-creations" } },
      { title: "جوائز وإنجازات", type: "ACHIEVEMENTS", sortOrder: 70, isVisible: true, subtitle: "تكريمات وميداليات وشهادات تميز", settings: { limit: 4, categorySlug: "awards-achievements" } },
      { title: "ابدأ الاستكشاف", type: "CUSTOM", sortOrder: 80, isVisible: true, subtitle: "تصفح جميع أقسام التربية الفنية واكتشف عالم الإبداع", settings: { cta: "/drawing-field", ctaLabel: "تصفح المجالات الفنية" } },
    ],
  });
}

async function seedSiteSettings() {
  const settings = [
    { key: "site_title", value: "موهبة فنان", label: "عنوان الموقع" },
    { key: "site_subtitle", value: "التربية الفنية بمدرسة عبد الرحمن بن عوف الابتدائية بجدة", label: "العنوان الفرعي" },
    { key: "site_description", value: "موقع موهبة فنان: بوابة التربية الفنية في مدرسة عبد الرحمن بن عوف الابتدائية بجدة. يعرض الأخبار والمعارض وإبداعات الطلاب والدروس والجوائز.", label: "وصف الموقع" },
    { key: "contact_email", value: "binawf@schools.edu.sa", label: "البريد الإلكتروني" },
    { key: "footer_text", value: "موقع مدرسة عبد الرحمن بن عوف الابتدائية بجدة", label: "نص تذييل الموقع" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, create: s, update: s });
  }
}

async function main() {
  const admin = await ensureAdmin();
  await seedCategories(admin.id);
  await seedNavigation();
  await seedHomepageSections();
  await seedSiteSettings();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
