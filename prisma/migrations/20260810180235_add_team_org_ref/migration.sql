/*
  Warnings:

  - You are about to drop the column `player_team` on the `player_matches` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PlayerSide" AS ENUM ('HOME', 'AWAY');

-- AlterTable
ALTER TABLE "player_matches" DROP COLUMN "player_team",
ADD COLUMN     "away_team_org_id" UUID,
ADD COLUMN     "home_team_org_id" UUID,
ADD COLUMN     "player_side" "PlayerSide";

-- AddForeignKey
ALTER TABLE "player_matches" ADD CONSTRAINT "player_matches_home_team_org_id_fkey" FOREIGN KEY ("home_team_org_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_matches" ADD CONSTRAINT "player_matches_away_team_org_id_fkey" FOREIGN KEY ("away_team_org_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
