/*
  Warnings:

  - You are about to drop the column `match_id` on the `player_matches` table. All the data in the column will be lost.
  - You are about to drop the `matches` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `match_date` to the `player_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `result` to the `player_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport_id` to the `player_matches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_sport_category_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_sport_id_fkey";

-- DropForeignKey
ALTER TABLE "player_matches" DROP CONSTRAINT "player_matches_match_id_fkey";

-- DropIndex
DROP INDEX "player_matches_match_id_idx";

-- DropIndex
DROP INDEX "player_matches_match_id_player_id_key";

-- AlterTable
ALTER TABLE "player_matches" DROP COLUMN "match_id",
ADD COLUMN     "away_team" TEXT,
ADD COLUMN     "home_team" TEXT,
ADD COLUMN     "match_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "match_type" TEXT,
ADD COLUMN     "reject_reason" TEXT,
ADD COLUMN     "result" "MatchResult" NOT NULL,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" UUID,
ADD COLUMN     "sport_category_id" UUID,
ADD COLUMN     "sport_id" UUID NOT NULL,
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "tournament" TEXT,
ADD COLUMN     "venue" TEXT;

-- DropTable
DROP TABLE "matches";

-- CreateIndex
CREATE INDEX "player_matches_sport_id_idx" ON "player_matches"("sport_id");

-- CreateIndex
CREATE INDEX "player_matches_match_date_idx" ON "player_matches"("match_date");

-- CreateIndex
CREATE INDEX "player_matches_status_idx" ON "player_matches"("status");

-- AddForeignKey
ALTER TABLE "player_matches" ADD CONSTRAINT "player_matches_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_matches" ADD CONSTRAINT "player_matches_sport_category_id_fkey" FOREIGN KEY ("sport_category_id") REFERENCES "sport_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
