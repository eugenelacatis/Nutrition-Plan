-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cookTimePref" TEXT,
ADD COLUMN     "mealCountPref" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "proteinPref" TEXT,
ADD COLUMN     "weightUnit" TEXT DEFAULT 'lbs';
