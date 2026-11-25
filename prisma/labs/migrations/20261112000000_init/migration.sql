-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GameScoreDirection" AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER');

-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GameEventValidationStatus" AS ENUM ('VALID', 'UNVERIFIED', 'REJECTED', 'PENDING');

-- CreateEnum
CREATE TYPE "GameRecordVerificationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "XpAwardStatus" AS ENUM ('PENDING', 'AWARDED', 'REJECTED', 'CAP_REACHED');

-- CreateEnum
CREATE TYPE "XpSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "LabsPlayer" (
    "id" TEXT NOT NULL,
    "externalXploreUserId" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabsPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scoreDirection" "GameScoreDirection" NOT NULL DEFAULT 'HIGHER_IS_BETTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameLevel" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "levelKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT,
    "sequence" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GameLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "GameSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "activeDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "verifiedDurationSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "levelId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "validationStatus" "GameEventValidationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerLevelProgress" (
    "playerId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "bestScore" INTEGER,
    "bestTimeSeconds" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "firstCompletedAt" TIMESTAMP(3),
    "lastCompletedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerLevelProgress_pkey" PRIMARY KEY ("playerId","levelId")
);

-- CreateTable
CREATE TABLE "GameAchievementDefinition" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "baseXp" INTEGER NOT NULL DEFAULT 0,
    "repeatPolicy" TEXT NOT NULL DEFAULT 'once',
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GameAchievementDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAchievement" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRecord" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "levelId" TEXT,
    "recordType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "GameRecordVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpAward" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "eventId" TEXT,
    "earningKey" TEXT NOT NULL,
    "achievementId" TEXT,
    "weekStart" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "requestedXp" INTEGER NOT NULL,
    "awardedXp" INTEGER NOT NULL,
    "status" "XpAwardStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "GameRecordVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyXpBalance" (
    "playerId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "earnedXp" INTEGER NOT NULL DEFAULT 0,
    "capXp" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyXpBalance_pkey" PRIMARY KEY ("playerId","weekStart")
);

-- CreateTable
CREATE TABLE "XpSyncOutbox" (
    "id" TEXT NOT NULL,
    "awardId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "externalUserId" TEXT,
    "tenantId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "verificationStatus" "GameRecordVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "idempotencyKey" TEXT NOT NULL,
    "status" "XpSyncStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpSyncOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalXploreXpEntry" (
    "id" TEXT NOT NULL,
    "outboxId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalXploreXpEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabsPlayer_externalXploreUserId_key" ON "LabsPlayer"("externalXploreUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GameDefinition_slug_key" ON "GameDefinition"("slug");

-- CreateIndex
CREATE INDEX "GameLevel_gameId_sequence_idx" ON "GameLevel"("gameId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "GameLevel_gameId_levelKey_key" ON "GameLevel"("gameId", "levelKey");

-- CreateIndex
CREATE INDEX "GameSession_playerId_gameId_status_idx" ON "GameSession"("playerId", "gameId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GameEvent_eventId_key" ON "GameEvent"("eventId");

-- CreateIndex
CREATE INDEX "GameEvent_playerId_gameId_eventType_idx" ON "GameEvent"("playerId", "gameId", "eventType");

-- CreateIndex
CREATE INDEX "GameEvent_eventId_idx" ON "GameEvent"("eventId");

-- CreateIndex
CREATE INDEX "PlayerLevelProgress_playerId_completed_idx" ON "PlayerLevelProgress"("playerId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "GameAchievementDefinition_gameId_key_key" ON "GameAchievementDefinition"("gameId", "key");

-- CreateIndex
CREATE INDEX "PlayerAchievement_playerId_earnedAt_idx" ON "PlayerAchievement"("playerId", "earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAchievement_playerId_achievementId_key" ON "PlayerAchievement"("playerId", "achievementId");

-- CreateIndex
CREATE INDEX "GameRecord_gameId_levelId_recordType_idx" ON "GameRecord"("gameId", "levelId", "recordType");

-- CreateIndex
CREATE UNIQUE INDEX "GameRecord_playerId_gameId_levelId_recordType_key" ON "GameRecord"("playerId", "gameId", "levelId", "recordType");

-- CreateIndex
CREATE UNIQUE INDEX "XpAward_earningKey_key" ON "XpAward"("earningKey");

-- CreateIndex
CREATE INDEX "XpAward_playerId_weekStart_idx" ON "XpAward"("playerId", "weekStart");

-- CreateIndex
CREATE INDEX "XpAward_status_idx" ON "XpAward"("status");

-- CreateIndex
CREATE UNIQUE INDEX "XpAward_playerId_weekStart_ruleKey_eventId_key" ON "XpAward"("playerId", "weekStart", "ruleKey", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "XpSyncOutbox_awardId_key" ON "XpSyncOutbox"("awardId");

-- CreateIndex
CREATE UNIQUE INDEX "XpSyncOutbox_idempotencyKey_key" ON "XpSyncOutbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "XpSyncOutbox_status_createdAt_idx" ON "XpSyncOutbox"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LocalXploreXpEntry_idempotencyKey_key" ON "LocalXploreXpEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LocalXploreXpEntry_externalUserId_createdAt_idx" ON "LocalXploreXpEntry"("externalUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "GameLevel" ADD CONSTRAINT "GameLevel_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerLevelProgress" ADD CONSTRAINT "PlayerLevelProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerLevelProgress" ADD CONSTRAINT "PlayerLevelProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAchievementDefinition" ADD CONSTRAINT "GameAchievementDefinition_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "GameAchievementDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpAward" ADD CONSTRAINT "XpAward_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpAward" ADD CONSTRAINT "XpAward_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpAward" ADD CONSTRAINT "XpAward_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "GameAchievementDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyXpBalance" ADD CONSTRAINT "WeeklyXpBalance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpSyncOutbox" ADD CONSTRAINT "XpSyncOutbox_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "XpAward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpSyncOutbox" ADD CONSTRAINT "XpSyncOutbox_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LabsPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalXploreXpEntry" ADD CONSTRAINT "LocalXploreXpEntry_outboxId_fkey" FOREIGN KEY ("outboxId") REFERENCES "XpSyncOutbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A Labs account can never exceed its fixed weekly XP limit, even if a writer
-- bypasses the application-level award transaction.
ALTER TABLE "WeeklyXpBalance"
ADD CONSTRAINT "WeeklyXpBalance_cap_check"
CHECK ("earnedXp" >= 0 AND "earnedXp" <= 50 AND "capXp" = 50);

-- Keep game and reward data inaccessible to Supabase anon/authenticated clients.
ALTER TABLE "LabsPlayer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameLevel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayerLevelProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameAchievementDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayerAchievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "XpAward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyXpBalance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "XpSyncOutbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LocalXploreXpEntry" ENABLE ROW LEVEL SECURITY;
