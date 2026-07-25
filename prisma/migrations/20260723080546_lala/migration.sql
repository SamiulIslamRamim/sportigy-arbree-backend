/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cricket_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `org_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `password_resets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pending_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('NUMBER', 'STRING', 'BOOLEAN', 'PERCENTAGE', 'DURATION_SECONDS');

-- CreateEnum
CREATE TYPE "AggregationType" AS ENUM ('SUM', 'AVERAGE', 'MAX', 'MIN', 'LATEST', 'NONE');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- DropForeignKey
ALTER TABLE "cricket_profiles" DROP CONSTRAINT "cricket_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "cricket_profiles";

-- DropTable
DROP TABLE "org_categories";

-- DropTable
DROP TABLE "password_resets";

-- DropTable
DROP TABLE "pending_registrations";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "BattingStyle";

-- DropEnum
DROP TYPE "BowlingStyle";

-- DropEnum
DROP TYPE "CricketPlayingRole";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportCategory" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatDefinition" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "dataType" "DataType" NOT NULL DEFAULT 'NUMBER',
    "aggregation" "AggregationType" NOT NULL DEFAULT 'SUM',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "minValue" INTEGER,
    "maxValue" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "sportCategoryId" TEXT NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "opponent" TEXT,
    "venue" TEXT,
    "tournament" TEXT,
    "matchType" TEXT,
    "homeTeam" TEXT,
    "awayTeam" TEXT,
    "matchResult" "MatchResult",
    "weatherCondition" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerMatchStat" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "sportCategoryId" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "playerRole" TEXT,
    "playerTeam" TEXT,
    "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "minutesPlayed" INTEGER,
    "performanceRating" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMatchStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCareerSummary" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "sportCategoryId" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "careerStats" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCareerSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sport_name_key" ON "Sport"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_slug_key" ON "Sport"("slug");

-- CreateIndex
CREATE INDEX "Sport_isActive_idx" ON "Sport"("isActive");

-- CreateIndex
CREATE INDEX "Sport_slug_idx" ON "Sport"("slug");

-- CreateIndex
CREATE INDEX "SportCategory_sportId_idx" ON "SportCategory"("sportId");

-- CreateIndex
CREATE INDEX "SportCategory_isActive_idx" ON "SportCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SportCategory_sportId_slug_key" ON "SportCategory"("sportId", "slug");

-- CreateIndex
CREATE INDEX "StatDefinition_sportId_idx" ON "StatDefinition"("sportId");

-- CreateIndex
CREATE INDEX "StatDefinition_isActive_idx" ON "StatDefinition"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StatDefinition_sportId_key_key" ON "StatDefinition"("sportId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- CreateIndex
CREATE INDEX "Player_isActive_idx" ON "Player"("isActive");

-- CreateIndex
CREATE INDEX "Player_email_idx" ON "Player"("email");

-- CreateIndex
CREATE INDEX "Match_sportId_idx" ON "Match"("sportId");

-- CreateIndex
CREATE INDEX "Match_sportCategoryId_idx" ON "Match"("sportCategoryId");

-- CreateIndex
CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");

-- CreateIndex
CREATE INDEX "Match_sportId_sportCategoryId_matchDate_idx" ON "Match"("sportId", "sportCategoryId", "matchDate");

-- CreateIndex
CREATE INDEX "PlayerMatchStat_playerId_idx" ON "PlayerMatchStat"("playerId");

-- CreateIndex
CREATE INDEX "PlayerMatchStat_matchId_idx" ON "PlayerMatchStat"("matchId");

-- CreateIndex
CREATE INDEX "PlayerMatchStat_sportId_idx" ON "PlayerMatchStat"("sportId");

-- CreateIndex
CREATE INDEX "PlayerMatchStat_sportCategoryId_idx" ON "PlayerMatchStat"("sportCategoryId");

-- CreateIndex
CREATE INDEX "PlayerMatchStat_playerId_sportId_sportCategoryId_idx" ON "PlayerMatchStat"("playerId", "sportId", "sportCategoryId");

-- CreateIndex
CREATE INDEX "PlayerMatchStat_playerId_sportId_createdAt_idx" ON "PlayerMatchStat"("playerId", "sportId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchStat_matchId_playerId_key" ON "PlayerMatchStat"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "PlayerCareerSummary_playerId_idx" ON "PlayerCareerSummary"("playerId");

-- CreateIndex
CREATE INDEX "PlayerCareerSummary_playerId_sportId_idx" ON "PlayerCareerSummary"("playerId", "sportId");

-- CreateIndex
CREATE INDEX "PlayerCareerSummary_sportId_sportCategoryId_idx" ON "PlayerCareerSummary"("sportId", "sportCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCareerSummary_playerId_sportId_sportCategoryId_key" ON "PlayerCareerSummary"("playerId", "sportId", "sportCategoryId");

-- AddForeignKey
ALTER TABLE "SportCategory" ADD CONSTRAINT "SportCategory_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatDefinition" ADD CONSTRAINT "StatDefinition_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_sportCategoryId_fkey" FOREIGN KEY ("sportCategoryId") REFERENCES "SportCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchStat" ADD CONSTRAINT "PlayerMatchStat_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchStat" ADD CONSTRAINT "PlayerMatchStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchStat" ADD CONSTRAINT "PlayerMatchStat_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchStat" ADD CONSTRAINT "PlayerMatchStat_sportCategoryId_fkey" FOREIGN KEY ("sportCategoryId") REFERENCES "SportCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCareerSummary" ADD CONSTRAINT "PlayerCareerSummary_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCareerSummary" ADD CONSTRAINT "PlayerCareerSummary_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCareerSummary" ADD CONSTRAINT "PlayerCareerSummary_sportCategoryId_fkey" FOREIGN KEY ("sportCategoryId") REFERENCES "SportCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
