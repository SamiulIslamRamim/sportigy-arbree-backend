-- CreateEnum
CREATE TYPE "BattingStyle" AS ENUM ('Right-hand bat', 'Left-hand bat');

-- CreateEnum
CREATE TYPE "BowlingStyle" AS ENUM ('Right-arm off-break', 'Right-arm leg-break', 'Right-arm fast', 'Left-arm fast', 'Left-arm spin', 'None');

-- CreateEnum
CREATE TYPE "CricketPlayingRole" AS ENUM ('Wicket Keeper', 'Batsman', 'Bowler', 'All Rounder');

-- CreateTable
CREATE TABLE "cricket_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "playingRole" "CricketPlayingRole" NOT NULL,
    "battingStyle" "BattingStyle" NOT NULL,
    "bowlingStyle" "BowlingStyle" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cricket_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cricket_profiles_userId_key" ON "cricket_profiles"("userId");

-- AddForeignKey
ALTER TABLE "cricket_profiles" ADD CONSTRAINT "cricket_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
