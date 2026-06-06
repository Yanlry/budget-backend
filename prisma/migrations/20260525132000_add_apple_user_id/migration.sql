-- AlterTable
ALTER TABLE "User"
ADD COLUMN "appleUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_appleUserId_key" ON "User"("appleUserId");
