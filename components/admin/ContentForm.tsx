"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PostStatus, PostType, type Category } from "@prisma/client";
import type { PostFormState } from "@/app/(admin)/admin/content/actions";
import { Save, Search, Star } from "lucide-react";

const statusOptions = [
  { value: PostStatus.DRAFT, label: "مسودة", color: "bg-amber-100 text-amber-700" },
  { value: PostStatus.PUBLISHED, label: "منشور", color: "bg-green-100 text-green-700" },
  { value: PostStatus.ARCHIVED, label: "مؤرشف", color: "bg-gray-100 text-gray-600" },
];

const typeOptions = [
  { value: PostType.PAGE, label: "صفحة" },
  { value: PostType.ARTICLE, label: "مقال" },
  { value: PostType.NEWS, label: "خبر" },
  { value: PostType.ANNOUNCEMENT, label: "إعلان" },
  { value: PostType.PROJECT, label: "مشروع" },
  { value: PostType.LESSON, label: "درس" },
  { value: PostType.RESEARCH, label: "بحث" },
  { value: PostType.AWARD, label: "جائزة" },
  { value: PostType.ACHIEVEMENT, label: "إنجاز" },
  { value: PostType.GALLERY, label: "معرض" },
  { value: PostType.EVENT, label: "فعالية" },
  { value: PostType.VIRTUAL_EXHIBITION, label: "معرض افتراضي" },
];

export function ContentForm({
  post,
  categories,
  action,
}: {
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    type: PostType;
    status: PostStatus;
    categoryId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    keywords: string | null;
    isFeatured: boolean;
  };
  categories: Category[];
  action: (prevState: PostFormState, formData: FormData) => Promise<PostFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const { pending } = useFormStatus();
  const [type, setType] = useState(post.type);
  const [status, setStatus] = useState(post.status);
  const [categoryId, setCategoryId] = useState<string>(post.categoryId || "__none__");
  const [isFeatured, setIsFeatured] = useState(post.isFeatured);

  return (
    <form action={formAction} className="space-y-6">
      {state?.errors && Object.values(state.errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {Object.values(state.errors).flat().join(" ")}
          </AlertDescription>
        </Alert>
      )}
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="isFeatured" value={isFeatured ? "true" : "false"} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-bold">العنوان</Label>
              <Input id="title" name="title" defaultValue={post.title} required className="h-11 text-base" placeholder="عنوان المحتوى" />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="slug" className="text-sm font-bold">المعرف (slug)</Label>
              <Input id="slug" name="slug" defaultValue={post.slug} required dir="ltr" className="h-10 font-mono text-sm" placeholder="my-article" />
              <p className="text-xs text-muted-foreground">يستخدم في الرابط: /category/my-article</p>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="excerpt" className="text-sm font-bold">الملخص</Label>
              <Textarea id="excerpt" name="excerpt" defaultValue={post.excerpt || ""} rows={2} placeholder="ملخص قصير يظهر في القوائم" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <Label htmlFor="content" className="mb-2 block text-sm font-bold">المحتوى (HTML)</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={post.content || ""}
              rows={16}
              dir="ltr"
              className="font-mono text-sm"
              placeholder="<p>محتوى المقال...</p>"
            />
            <p className="mt-2 text-xs text-muted-foreground">يدعم HTML — فقرات، صور، روابط، قوائم</p>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-5">
          {/* Publish box */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-bold text-foreground">النشر</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">الحالة</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox id="isFeatured" checked={isFeatured} onCheckedChange={(v) => setIsFeatured(Boolean(v))} />
                <Label htmlFor="isFeatured" className="cursor-pointer text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-accent" />
                    محتوى مميز
                  </span>
                </Label>
              </div>
            </div>
            <Button type="submit" disabled={pending} className="mt-4 w-full h-10">
              <Save className="h-4 w-4" />
              {pending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>

          {/* Type + Category */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-bold text-foreground">التصنيف</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">النوع</Label>
                <Select value={type} onValueChange={(v) => setType(v as PostType)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">القسم</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "__none__")}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="اختياري" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون قسم</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
              <Search className="h-4 w-4 text-accent" />
              تحسين محركات البحث
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="metaTitle" className="text-xs font-semibold text-muted-foreground">عنوان SEO</Label>
                <Input id="metaTitle" name="metaTitle" defaultValue={post.metaTitle || ""} className="h-9 text-sm" placeholder="عنوان مخصص لمحركات البحث" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription" className="text-xs font-semibold text-muted-foreground">وصف SEO</Label>
                <Textarea id="metaDescription" name="metaDescription" defaultValue={post.metaDescription || ""} rows={2} className="text-sm" placeholder="وصف مخصص" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords" className="text-xs font-semibold text-muted-foreground">الكلمات المفتاحية</Label>
                <Input id="keywords" name="keywords" defaultValue={post.keywords || ""} className="h-9 text-sm" placeholder="كلمة1, كلمة2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
