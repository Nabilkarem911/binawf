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
import { PostType, type Category, type Media } from "@prisma/client";
import type { CategoryFormState } from "@/app/(admin)/admin/categories/actions";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { SearchableTreeCombobox } from "@/components/admin/SearchableTreeCombobox";
import { Save } from "lucide-react";

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

const typeLabelMap: Record<string, string> = Object.fromEntries(
  typeOptions.map((t) => [t.value, t.label])
);

export function CategoryForm({
  category,
  categories,
  media,
  action,
}: {
  category: {
    id?: string;
    title: string;
    slug: string;
    description: string | null;
    contentType: PostType | null;
    parentId: string | null;
    sortOrder: number;
    isVisible: boolean;
    showInMenu: boolean;
    imageId: string | null;
  };
  categories: Category[];
  media: Media[];
  action: (prevState: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const { pending } = useFormStatus();
  const [contentType, setContentType] = useState(category.contentType || PostType.ARTICLE);
  const [parentId, setParentId] = useState(category.parentId || "__none__");
  const [isVisible, setIsVisible] = useState(category.isVisible);
  const [showInMenu, setShowInMenu] = useState(category.showInMenu);
  const [imageId, setImageId] = useState<string | null>(category.imageId);

  const availableParents = categories.filter((c) => c.id !== category.id);

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

      <input type="hidden" name="contentType" value={contentType} />
      <input type="hidden" name="parentId" value={parentId} />
      <input type="hidden" name="isVisible" value={isVisible ? "true" : "false"} />
      <input type="hidden" name="showInMenu" value={showInMenu ? "true" : "false"} />
      <input type="hidden" name="imageId" value={imageId || ""} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">العنوان</Label>
          <Input id="title" name="title" defaultValue={category.title} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">المعرف (slug)</Label>
          <Input id="slug" name="slug" defaultValue={category.slug} required dir="ltr" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>نوع القسم</Label>
          <Select value={contentType} onValueChange={(v) => setContentType(v as PostType)}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => (v ? typeLabelMap[v] ?? v : "اختر النوع")}
              </SelectValue>
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
          <Label>القسم الأب</Label>
          <SearchableTreeCombobox
            nodes={availableParents.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }))}
            selectedId={parentId === "__none__" ? null : parentId}
            onSelect={(id) => setParentId(id || "__none__")}
            placeholder="بدون أب (قسم رئيسي)"
            searchPlaceholder="ابحث عن قسم..."
            noneLabel="بدون أب (قسم رئيسي)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">الترتيب</Label>
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={category.sortOrder} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Textarea id="description" name="description" defaultValue={category.description || ""} rows={3} />
      </div>

      {/* Category image */}
      <MediaPicker
        media={media}
        selectedId={imageId}
        onSelect={(m) => setImageId(m ? m.id : null)}
        label="صورة القسم"
      />

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox id="isVisible" checked={isVisible} onCheckedChange={(v) => setIsVisible(Boolean(v))} />
          <Label htmlFor="isVisible" className="cursor-pointer">
            مرئي
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="showInMenu" checked={showInMenu} onCheckedChange={(v) => setShowInMenu(Boolean(v))} />
          <Label htmlFor="showInMenu" className="cursor-pointer">
            إظهار في القائمة
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
