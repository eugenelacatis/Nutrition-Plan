-- AlterTable
ALTER TABLE "PlanMeal" ADD COLUMN     "scheduledTime" TEXT,
ADD COLUMN     "slot" TEXT NOT NULL DEFAULT 'snack',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sleepTime" TEXT,
ADD COLUMN     "wakeTime" TEXT,
ADD COLUMN     "workEnd" TEXT,
ADD COLUMN     "workStart" TEXT,
ADD COLUMN     "workoutTime" TEXT;
