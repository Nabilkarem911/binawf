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
      <h1 className="text-2xl font-bold">الوسائط</h1>
      <MediaUploadForm media={media} />
    </div>
  );
}
