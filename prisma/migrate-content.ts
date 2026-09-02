/**
 * Content migration script — creates the complete category structure
 * matching the legacy Google Site, with placeholder posts for key pages.
 *
 * Images from the legacy site are hosted on Google's internal CDN
 * (lh3.googleusercontent.com/sitesv/) and need to be downloaded separately.
 * See CONTENT_INVENTORY.md and MIGRATION_GAPS.md for details.
 *
 * Usage: npx tsx prisma/migrate-content.ts
 */

import { prisma } from "../lib/prisma";
import { PostStatus, PostType } from "@prisma/client";

type CategoryInput = {
  title: string;
  slug: string;
  description?: string;
  contentType?: PostType;
  sortOrder?: number;
  children?: CategoryInput[];
};

type PostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: PostType;
  categorySlug: string;
  status?: PostStatus;
  isFeatured?: boolean;
  metadata?: Record<string, unknown>;
};

const categoryTree: CategoryInput[] = [
  {
    title: "التربية الخاصة",
    slug: "special-education",
    description: "إبداعات طلاب التربية الخاصة",
    contentType: PostType.GALLERY,
    sortOrder: 10,
  },
  {
    title: "المشروعات الفنية",
    slug: "art-projects",
    description: "مشروعات فنية للطلاب",
    contentType: PostType.PROJECT,
    sortOrder: 20,
    children: [
      {
        title: "مشروعات الصف الرابع",
        slug: "grade-4-projects",
        description: "مشروعات فنية لطلاب الصف الرابع",
        contentType: PostType.PROJECT,
        sortOrder: 10,
      },
      {
        title: "مشروعات الصف الخامس",
        slug: "grade-5-projects",
        description: "مشروعات فنية لطلاب الصف الخامس",
        contentType: PostType.PROJECT,
        sortOrder: 20,
      },
    ],
  },
  {
    title: "مجال الرسم",
    slug: "drawing",
    description: "أعمال طلاب مجال الرسم",
    contentType: PostType.GALLERY,
    sortOrder: 30,
    children: [
      {
        title: "الصف الرابع",
        slug: "grade-4-drawing",
        description: "رسومات طلاب الصف الرابع",
        contentType: PostType.GALLERY,
        sortOrder: 10,
        children: [
          { title: "الرابع / ٥", slug: "grade-4-section-5", contentType: PostType.GALLERY, sortOrder: 10 },
          { title: "الرابع / ٦", slug: "grade-4-section-6", contentType: PostType.GALLERY, sortOrder: 20 },
          { title: "الرابع / ٧", slug: "grade-4-section-7", contentType: PostType.GALLERY, sortOrder: 30 },
        ],
      },
      {
        title: "الصف الخامس",
        slug: "grade-5-drawing",
        description: "رسومات طلاب الصف الخامس",
        contentType: PostType.GALLERY,
        sortOrder: 20,
        children: [
          { title: "الخامس / ١", slug: "grade-5-section-1", contentType: PostType.GALLERY, sortOrder: 10 },
          { title: "الخامس / ٢", slug: "grade-5-section-2", contentType: PostType.GALLERY, sortOrder: 20 },
          { title: "الخامس / ٣", slug: "grade-5-section-3", contentType: PostType.GALLERY, sortOrder: 30 },
          { title: "الخامس / ٤", slug: "grade-5-section-4", contentType: PostType.GALLERY, sortOrder: 40 },
        ],
      },
    ],
  },
  {
    title: "مجال الخزف",
    slug: "ceramics",
    description: "أعمال طلاب مجال الخزف — ٢١٨ صورة من الموقع القديم",
    contentType: PostType.GALLERY,
    sortOrder: 40,
  },
  {
    title: "مجال الزخرفة",
    slug: "decoration",
    description: "أعمال طلاب مجال الزخرفة",
    contentType: PostType.GALLERY,
    sortOrder: 50,
    children: [
      { title: "الزخرفة الهندسية", slug: "geometric-decoration", description: "زخرفة هندسية — ٢٠٩ صورة", contentType: PostType.GALLERY, sortOrder: 10 },
      { title: "الزخرفة النباتية", slug: "floral-decoration", description: "زخرفة نباتية", contentType: PostType.GALLERY, sortOrder: 20 },
      { title: "الزخرفة الكتابية", slug: "calligraphic-decoration", description: "زخرفة كتابية", contentType: PostType.GALLERY, sortOrder: 30 },
    ],
  },
  {
    title: "مجال المعادن",
    slug: "metals",
    description: "أعمال طلاب مجال المعادن — ١٧٥ صورة",
    contentType: PostType.GALLERY,
    sortOrder: 60,
  },
  {
    title: "مجال الخشب",
    slug: "wood",
    description: "أعمال طلاب مجال الخشب — ١٠٣ صورة",
    contentType: PostType.GALLERY,
    sortOrder: 70,
  },
  {
    title: "مجال النسيج",
    slug: "textiles",
    description: "أعمال طلاب مجال النسيج — ١٣٨ صورة",
    contentType: PostType.GALLERY,
    sortOrder: 80,
  },
  {
    title: "الشارة الذهبية",
    slug: "gold-badge",
    description: "الشارة الذهبية للتفوق الفني",
    contentType: PostType.AWARD,
    sortOrder: 90,
    children: [
      {
        title: "عام ١٤٤٣ هـ",
        slug: "gold-badge-1443",
        contentType: PostType.AWARD,
        sortOrder: 10,
        children: [
          { title: "الفصل الدراسي الأول", slug: "gold-badge-1443-term-1", contentType: PostType.AWARD, sortOrder: 10 },
          { title: "الفصل الدراسي الثاني", slug: "gold-badge-1443-term-2", contentType: PostType.AWARD, sortOrder: 20 },
          { title: "الفصل الدراسي الثالث", slug: "gold-badge-1443-term-3", contentType: PostType.AWARD, sortOrder: 30 },
        ],
      },
      {
        title: "عام ١٤٤٥ هـ",
        slug: "gold-badge-1445",
        contentType: PostType.AWARD,
        sortOrder: 20,
        children: [
          { title: "الفصل الدراسي الأول", slug: "gold-badge-1445-term-1", contentType: PostType.AWARD, sortOrder: 10 },
          { title: "الفصل الدراسي الثاني", slug: "gold-badge-1445-term-2", contentType: PostType.AWARD, sortOrder: 20 },
          { title: "الفصل الدراسي الثالث", slug: "gold-badge-1445-term-3", contentType: PostType.AWARD, sortOrder: 30 },
        ],
      },
      {
        title: "عام ١٤٤٧ هـ",
        slug: "gold-badge-1447",
        contentType: PostType.AWARD,
        sortOrder: 30,
        children: [
          { title: "الفصل الدراسي الأول", slug: "gold-badge-1447-term-1", contentType: PostType.AWARD, sortOrder: 10 },
          { title: "الفصل الدراسي الثاني", slug: "gold-badge-1447-term-2", contentType: PostType.AWARD, sortOrder: 20 },
        ],
      },
    ],
  },
  {
    title: "اليوم الوطني",
    slug: "national-day-legacy",
    description: "احتفالات اليوم الوطني",
    contentType: PostType.GALLERY,
    sortOrder: 100,
    children: [
      { title: "اليوم الوطني ٩٠", slug: "national-day-90", contentType: PostType.GALLERY, sortOrder: 10 },
      { title: "اليوم الوطني ٩١", slug: "national-day-91-legacy", contentType: PostType.GALLERY, sortOrder: 20 },
      { title: "اليوم الوطني ٩٢", slug: "national-day-92", contentType: PostType.GALLERY, sortOrder: 30 },
      { title: "اليوم الوطني ٩٣", slug: "national-day-93", contentType: PostType.GALLERY, sortOrder: 40 },
      { title: "اليوم الوطني ٩٤", slug: "national-day-94", contentType: PostType.GALLERY, sortOrder: 50 },
      { title: "اليوم الوطني ٩٥", slug: "national-day-95", contentType: PostType.GALLERY, sortOrder: 60 },
    ],
  },
  {
    title: "إبداعات الطلاب",
    slug: "student-creations",
    description: "إبداعات طلاب المدرسة لعام ١٤٤٥ هـ — ١٨١ صورة",
    contentType: PostType.GALLERY,
    sortOrder: 110,
  },
  {
    title: "بحوث ومشروعات وتقارير",
    slug: "research-projects",
    description: "بحوث ومشروعات وتقارير الطلاب — ٦٩ صورة",
    contentType: PostType.RESEARCH,
    sortOrder: 120,
  },
  {
    title: "جوائز وإنجازات",
    slug: "awards-achievements",
    description: "جوائز وإنجازات المدرسة — ٢١ صورة",
    contentType: PostType.ACHIEVEMENT,
    sortOrder: 130,
  },
  {
    title: "معارض التربية الفنية",
    slug: "art-exhibitions",
    description: "معارض التربية الفنية",
    contentType: PostType.GALLERY,
    sortOrder: 140,
    children: [
      { title: "معرض التربية الفنية عام ١٤٤٤ هـ", slug: "exhibition-1444", contentType: PostType.GALLERY, sortOrder: 10 },
      { title: "معرض يوم التأسيس عام ١٤٤٤ هـ", slug: "foundation-day-1444", contentType: PostType.GALLERY, sortOrder: 20 },
      { title: "معرض التربية الفنية عام ١٤٣٩-١٤٤٠ هـ", slug: "exhibition-1439-1440", description: "معرض بقيمة ١٨ صورة", contentType: PostType.GALLERY, sortOrder: 30 },
    ],
  },
  {
    title: "المعارض الافتراضية",
    slug: "virtual-exhibitions",
    description: "معارض افتراضية — تحتوي على روابط Google Drive",
    contentType: PostType.VIRTUAL_EXHIBITION,
    sortOrder: 150,
  },
  {
    title: "دروس التربية الفنية",
    slug: "art-lessons",
    description: "دروس التربية الفنية — قسم فارغ للمستقبل",
    contentType: PostType.LESSON,
    sortOrder: 160,
  },
  {
    title: "الإعلانات",
    slug: "announcements",
    description: "إعلانات المدرسة",
    contentType: PostType.ANNOUNCEMENT,
    sortOrder: 170,
  },
];

const placeholderPosts: PostInput[] = [
  {
    title: "معرض الاحتفاء باليوم الوطني ٩١ للمدارس",
    slug: "national-day-91-celebration",
    excerpt: "معرض الاحتفاء باليوم الوطني ٩١ للمدارس بمدرسة عبد الرحمن بن عوف الابتدائية",
    content: '<p>معرض الاحتفاء باليوم الوطني ٩١ للمدارس. يحتوي على صور الطلاب وأعمالهم الفنية.</p><p>الفيديو: <a href="https://www.youtube.com/watch?v=5C786iMeFXQ">قناة التربية الفنية binawf</a></p>',
    type: PostType.GALLERY,
    categorySlug: "national-day-91-legacy",
    isFeatured: true,
    metadata: { year: 91, videoUrl: "https://www.youtube.com/watch?v=5C786iMeFXQ" },
  },
  {
    title: "مشاركة المدرسة في أولمبياد السلام الرياضي",
    slug: "sports-olympiad-1445",
    excerpt: "مشاركة المدرسة في مسابقة أفضل أنموذج رياضي في أولمبياد السلام الرياضي ١٤٤٥ هـ",
    content: '<p>مشاركة المدرسة في مسابقة أفضل أنموذج رياضي في أولمبياد السلام الرياضي ١٤٤٥ هـ.</p>',
    type: PostType.NEWS,
    categorySlug: "art-education-news",
    metadata: { year: 1445 },
  },
  {
    title: "إطلاق فعاليات أسبوع الصم العربي ٤٧",
    slug: "arab-deaf-week-47",
    excerpt: "مدير التعليم يطلق فعاليات أسبوع الصم العربي ٤٧ — المدرسة تعرض أعمال طلاب التربية الخاصة",
    content: '<p>مدير التعليم يطلق فعاليات أسبوع الصم العربي ٤٧. عرضت المدرسة أعمال طلاب التربية الخاصة في معرض مصاحب للفعالية.</p><p>الفيديو: <iframe width="560" height="315" src="https://www.youtube.com/embed/3C6FM6bl7k8" frameborder="0" allowfullscreen></iframe></p>',
    type: PostType.NEWS,
    categorySlug: "art-education-news",
    metadata: { year: 1445, videoUrl: "https://www.youtube.com/embed/3C6FM6bl7k8" },
  },
  {
    title: "إبداعات الطلاب عام ١٤٤٥ هـ",
    slug: "student-creations-1445",
    excerpt: "معرض إبداعات الطلاب لعام ١٤٤٥ هـ — أكثر من ١٧٠ طالب من الصفين الرابع والخامس",
    content: '<p>معرض إبداعات الطلاب لعام ١٤٤٥ هـ. يحتوي على أكثر من ١٧٠ مشاركة لطلاب من الصفين الرابع والخامس من عدة فصول.</p><p><em>ملاحظة: الصور من الموقع القديم بحاجة إلى ترحيل يدوي من Google CDN.</em></p>',
    type: PostType.GALLERY,
    categorySlug: "student-creations",
    isFeatured: true,
    metadata: { year: 1445, imageCount: 170 },
  },
  {
    title: "معرض التربية الفنية عام ١٤٣٩-١٤٤٠ هـ",
    slug: "exhibition-1439-1440-photos",
    excerpt: "صور معرض التربية الفنية للعام الدراسي ١٤٣٩-١٤٤٠ هـ",
    content: '<p>معرض التربية الفنية للعام الدراسي ١٤٣٩-١٤٤٠ هـ. يحتوي على ١٦ صورة لأعمال الطلاب.</p><p><em>ملاحظة: الصور من الموقع القديم بحاجة إلى ترحيل يدوي.</em></p>',
    type: PostType.GALLERY,
    categorySlug: "exhibition-1439-1440",
    metadata: { year: 1439, imageCount: 16 },
  },
];

async function createCategoryTree(
  items: CategoryInput[],
  parentId?: string
): Promise<void> {
  for (const item of items) {
    const existing = await prisma.category.findUnique({ where: { slug: item.slug } });
    if (existing) {
      // Update only non-structural fields if exists — don't change parentId
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          description: item.description || existing.description,
          contentType: item.contentType || existing.contentType,
          sortOrder: item.sortOrder ?? existing.sortOrder,
        },
      });
      if (item.children) {
        await createCategoryTree(item.children, existing.id);
      }
      continue;
    }

    const cat = await prisma.category.create({
      data: {
        title: item.title,
        slug: item.slug,
        description: item.description || null,
        contentType: item.contentType || PostType.ARTICLE,
        parentId: parentId || null,
        sortOrder: item.sortOrder ?? 0,
        isVisible: true,
        showInMenu: true,
      },
    });

    if (item.children) {
      await createCategoryTree(item.children, cat.id);
    }
  }
}

async function createPlaceholderPosts(posts: PostInput[]): Promise<void> {
  for (const post of posts) {
    const category = await prisma.category.findUnique({ where: { slug: post.categorySlug } });
    if (!category) {
      console.warn(`Category not found for post "${post.title}": ${post.categorySlug}`);
      continue;
    }

    const existing = await prisma.post.findUnique({
      where: { slug_categoryId: { slug: post.slug, categoryId: category.id } },
    });
    if (existing) {
      console.log(`Post already exists: ${post.title}`);
      continue;
    }

    await prisma.post.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        type: post.type,
        status: post.status ?? PostStatus.PUBLISHED,
        categoryId: category.id,
        isFeatured: post.isFeatured ?? false,
        publishedAt: new Date(),
        metadata: (post.metadata ?? undefined) as never,
      },
    });
    console.log(`Created post: ${post.title}`);
  }
}

async function main() {
  console.log("Starting content migration...");
  console.log("Creating category tree...");
  await createCategoryTree(categoryTree);
  console.log("Category tree created.");

  console.log("Creating placeholder posts...");
  await createPlaceholderPosts(placeholderPosts);
  console.log("Placeholder posts created.");

  const catCount = await prisma.category.count();
  const postCount = await prisma.post.count();
  console.log(`\nMigration complete: ${catCount} categories, ${postCount} posts`);
  console.log("\nNOTE: Images from the legacy site need to be downloaded separately.");
  console.log("See CONTENT_INVENTORY.md and MIGRATION_GAPS.md for details.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
