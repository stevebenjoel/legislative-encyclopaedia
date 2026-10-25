CREATE TYPE "CorrespondenceStatus" AS ENUM ('REGISTERED', 'ASSIGNED', 'DRAFTING_RESPONSE', 'RESPONDED', 'ARCHIVED');

ALTER TABLE "Correspondence"
  ADD COLUMN "senderOrRecipient" TEXT NOT NULL DEFAULT 'Not recorded',
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "status" "CorrespondenceStatus" NOT NULL DEFAULT 'REGISTERED',
  ADD COLUMN "assignedToId" TEXT,
  ADD COLUMN "responseDraft" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Correspondence" ALTER COLUMN "senderOrRecipient" DROP DEFAULT;

ALTER TABLE "Correspondence"
  ADD CONSTRAINT "Correspondence_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Correspondence_institutionId_status_responseDueAt_idx"
  ON "Correspondence"("institutionId", "status", "responseDueAt");

CREATE INDEX "Correspondence_assignedToId_status_idx"
  ON "Correspondence"("assignedToId", "status");

