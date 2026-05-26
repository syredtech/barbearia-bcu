-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "breakEnd" TEXT,
ADD COLUMN     "breakStart" TEXT,
ADD COLUMN     "scheduleEnd" TEXT NOT NULL DEFAULT '18:00',
ADD COLUMN     "scheduleStart" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "slotDuration" INTEGER NOT NULL DEFAULT 60;
