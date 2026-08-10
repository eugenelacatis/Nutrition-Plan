-- CreateTable
CREATE TABLE "TrialPlanPool" (
    "id" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "plans" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialPlanPool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialPlanPool_goal_key" ON "TrialPlanPool"("goal");
