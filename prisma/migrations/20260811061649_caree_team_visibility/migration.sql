-- AlterTable
ALTER TABLE "player_match_field_values" ALTER COLUMN "value_number" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "player_team_visibility" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "sport_id" UUID NOT NULL,
    "team_key" TEXT NOT NULL,
    "team_label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_team_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_team_visibility_player_id_sport_id_team_key_key" ON "player_team_visibility"("player_id", "sport_id", "team_key");

-- CreateIndex
CREATE INDEX "player_matches_player_id_sport_id_status_idx" ON "player_matches"("player_id", "sport_id", "status");

-- AddForeignKey
ALTER TABLE "player_team_visibility" ADD CONSTRAINT "player_team_visibility_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_team_visibility" ADD CONSTRAINT "player_team_visibility_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
