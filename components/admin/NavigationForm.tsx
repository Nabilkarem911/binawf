"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { NavigationFormState } from "@/app/(admin)/admin/navigation/actions";
import { Save } from "lucide-react";

const locationOptions = [
  { value: "HEADER", label: "الترويسة" },
  { value: "FOOTER", label: "التذييل" },
];

const locationLabelMap: Record<string, string> = Object.fromEntries(
  locationOptions.map((l) => [l.value, l.label])
);

const targetOptions = [
  { value: "_blank", label: "نافذة جديدة" },
  { value: "__none__", label: "نفس النافذة" },
];

const targetLabelMap: Record<string, string> = Object.fromEntries(
  targetOptions.map((t) => [t.value, t.label])
);

export function NavigationForm({
  item,
  parentItems,
  action,
}: {
  item: {
    id?: string;
    title: string;
    url: string;
    target: string | null;
    icon: string | null;
    parentId: string | null;
    sortOrder: number;
    isVisible: boolean;
    location: string;
  };
  parentItems: { id: string; title: string }[];
  action: (prevState: NavigationFormState, formData: FormData) => Promise<NavigationFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const { pending } = useFormStatus();
  const [location, setLocation] = useState(item.location || "HEADER");
  const [parentId, setParentId] = useState(item.parentId || "__none__");
  const [target, setTarget] = useState(item.target || "__none__");
  const [isVisible, setIsVisible] = useState(item.isVisible);

  const availableParents = parentItems.filter((p) => p.id !== item.id);

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

      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="parentId" value={parentId} />
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="isVisible" value={isVisible ? "true" : "false"} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-bold">العنوان</Label>
          <Input id="title" name="title" defaultValue={item.title} required className="h-11 text-base" placeholder="عنوان القائمة" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-bold">الرابط (URL)</Label>
          <Input id="url" name="url" defaultValue={item.url} required dir="ltr" className="h-11 font-mono text-sm" placeholder="/about" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-bold">الموقع</Label>
          <Select value={location} onValueChange={(v) => setLocation(v as string)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue>
                {(v: string | null) => (v ? locationLabelMap[v] ?? v : "اختر الموقع")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">العنصر الأب</Label>
          <Select value={parentId} onValueChange={(v) => setParentId(v ?? "__none__")}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue>
                {(v: string | null) => {
                  if (!v || v === "__none__") return "بدون أب (عنصر رئيسي)";
                  const parent = availableParents.find((p) => p.id === v);
                  return parent ? parent.title : "بدون أب (عنصر رئيسي)";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">بدون أب (عنصر رئيسي)</SelectItem>
              {availableParents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-bold">الهدف (Target)</Label>
          <Select value={target} onValueChange={(v) => setTarget(v ?? "__none__")}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue>
                {(v: string | null) => (v ? targetLabelMap[v] ?? v : "اختر الهدف")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon" className="text-sm font-bold">الأيقونة (اختياري)</Label>
          <Input id="icon" name="icon" defaultValue={item.icon || ""} dir="ltr" className="h-11 font-mono text-sm" placeholder="lucide-icon-name" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sortOrder" className="text-sm font-bold">الترتيب</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={item.sortOrder} className="h-11" />
        </div>

        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox id="isVisible" checked={isVisible} onCheckedChange={(v) => setIsVisible(Boolean(v))} />
            <Label htmlFor="isVisible" className="cursor-pointer text-sm font-bold">
              ظاهر
            </Label>
          </div>
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
