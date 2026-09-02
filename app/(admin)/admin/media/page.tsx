import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaUploadForm } from "@/components/admin/MediaUploadForm";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAuth();
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">مكتبة الوسائط</h1>
        <p className="mt-1 text-sm text-muted-foreground">{media.length} ملف — ارفع وأدر صور ومقاطع ومستندات الموقع</p>
      </div>
      <MediaUploadForm media={media} />
    </div>
  );
}
