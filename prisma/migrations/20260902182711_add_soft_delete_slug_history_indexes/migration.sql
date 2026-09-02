-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "slug_history" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "newSlug" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slug_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slug_history_oldSlug_idx" ON "slug_history"("oldSlug");

-- CreateIndex
CREATE INDEX "slug_history_entityType_entityId_idx" ON "slug_history"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "categories_parentId_sortOrder_idx" ON "categories"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "categories_isVisible_showInMenu_idx" ON "categories"("isVisible", "showInMenu");

-- CreateIndex
CREATE INDEX "media_type_createdAt_idx" ON "media"("type", "createdAt");

-- CreateIndex
CREATE INDEX "navigation_items_location_isVisible_sortOrder_idx" ON "navigation_items"("location", "isVisible", "sortOrder");

-- CreateIndex
CREATE INDEX "navigation_items_parentId_sortOrder_idx" ON "navigation_items"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "posts_deletedAt_idx" ON "posts"("deletedAt");
