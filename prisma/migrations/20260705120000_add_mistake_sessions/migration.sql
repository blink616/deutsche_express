-- CreateTable
CREATE TABLE "StudySession" (
    "id" UUID NOT NULL,
    "deck" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Review"
ADD COLUMN "sessionId" UUID,
ADD COLUMN "mode" TEXT,
ADD COLUMN "submittedAnswer" TEXT,
ADD COLUMN "mistakeKind" TEXT;

-- CreateIndex
CREATE INDEX "StudySession_startedAt_idx" ON "StudySession"("startedAt");

-- CreateIndex
CREATE INDEX "Review_sessionId_idx" ON "Review"("sessionId");

-- CreateIndex
CREATE INDEX "Review_wordId_correct_reviewedAt_idx" ON "Review"("wordId", "correct", "reviewedAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
