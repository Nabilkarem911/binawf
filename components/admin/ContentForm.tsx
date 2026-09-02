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

const statusOptions = [
  { value: PostStatus.DRAFT, label: "مسودة" },
  { value: PostStatus.PUBLISHED, label: "منشور" },
  { value: PostStatus.ARCHIVED, label: "مؤرشف" },
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
            {Object.values(state.errors)
              .flat()
              .join(" ")}
          </AlertDescription>
        </Alert>
      )}
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="isFeatured" value={isFeatured ? "true" : "false"} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">العنوان</Label>
          <Input id="title" name="title" defaultValue={post.title} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">المعرف (slug)</Label>
          <Input id="slug" name="slug" defaultValue={post.slug} required dir="ltr" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>النوع</Label>
          <Select value={type} onValueChange={(v) => setType(v as PostType)}>
            <SelectTrigger>
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
          <Label>الحالة</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
            <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label>القسم</Label>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "__none__")}>
          <SelectTrigger>
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

      <div className="space-y-2">
        <Label htmlFor="excerpt">الملخص</Label>
        <Textarea id="excerpt" name="excerpt" defaultValue={post.excerpt || ""} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">المحتوى (HTML)</Label>
        <Textarea id="content" name="content" defaultValue={post.content || ""} rows={12} dir="ltr" />
        <p className="text-xs text-muted-foreground">يمكنك إدخال HTML.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="metaTitle">عنوان SEO</Label>
          <Input id="metaTitle" name="metaTitle" defaultValue={post.metaTitle || ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaDescription">وصف SEO</Label>
          <Input id="metaDescription" name="metaDescription" defaultValue={post.metaDescription || ""} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="keywords">الكلمات المفتاحية</Label>
          <Input id="keywords" name="keywords" defaultValue={post.keywords || ""} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Checkbox id="isFeatured" checked={isFeatured} onCheckedChange={(v) => setIsFeatured(Boolean(v))} />
          <Label htmlFor="isFeatured" className="cursor-pointer">
            محتوى مميز
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
