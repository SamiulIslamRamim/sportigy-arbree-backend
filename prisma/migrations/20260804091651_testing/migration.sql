-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('player', 'organization');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSS', 'DRAW', 'TIE', 'NO_RESULT');

-- CreateEnum
CREATE TYPE "FieldSection" AS ENUM ('PROFILE', 'MATCH');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('SELECT', 'MULTI_SELECT', 'NUMBER', 'TEXT', 'BOOLEAN', 'DATE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'player',
    "name" TEXT,
    "contact_no" TEXT,
    "bio" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "birthday" DATE,
    "categories" TEXT[],
    "website_url" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_registrations" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "sport_id" UUID NOT NULL,
    "sport_category_id" UUID,
    "title" TEXT,
    "tournament" TEXT,
    "match_type" TEXT,
    "venue" TEXT,
    "home_team" TEXT,
    "away_team" TEXT,
    "match_date" TIMESTAMP(3) NOT NULL,
    "result" "MatchResult" NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_matches" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "player_team" TEXT,
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "is_substitute" BOOLEAN NOT NULL DEFAULT false,
    "minutes_played" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_match_field_values" (
    "id" UUID NOT NULL,
    "player_match_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "option_id" UUID,
    "value_text" TEXT,
    "value_number" INTEGER,
    "value_boolean" BOOLEAN,
    "value_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_match_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_categories" (
    "id" UUID NOT NULL,
    "sport_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_fields" (
    "id" UUID NOT NULL,
    "sport_id" UUID NOT NULL,
    "section" "FieldSection" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "filterable" BOOLEAN NOT NULL DEFAULT true,
    "sortable" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_field_options" (
    "id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_field_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_field_values" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "option_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_sport_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sport_id" UUID NOT NULL,
    "academy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_sport_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "password_resets_email_idx" ON "password_resets"("email");

-- CreateIndex
CREATE INDEX "pending_registrations_email_idx" ON "pending_registrations"("email");

-- CreateIndex
CREATE INDEX "matches_sport_id_idx" ON "matches"("sport_id");

-- CreateIndex
CREATE INDEX "matches_match_date_idx" ON "matches"("match_date");

-- CreateIndex
CREATE INDEX "matches_sport_category_id_idx" ON "matches"("sport_category_id");

-- CreateIndex
CREATE INDEX "player_matches_player_id_idx" ON "player_matches"("player_id");

-- CreateIndex
CREATE INDEX "player_matches_match_id_idx" ON "player_matches"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_matches_match_id_player_id_key" ON "player_matches"("match_id", "player_id");

-- CreateIndex
CREATE INDEX "player_match_field_values_player_match_id_idx" ON "player_match_field_values"("player_match_id");

-- CreateIndex
CREATE INDEX "player_match_field_values_field_id_idx" ON "player_match_field_values"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_match_field_values_player_match_id_field_id_key" ON "player_match_field_values"("player_match_id", "field_id");

-- CreateIndex
CREATE UNIQUE INDEX "sports_name_key" ON "sports"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sports_slug_key" ON "sports"("slug");

-- CreateIndex
CREATE INDEX "sports_slug_idx" ON "sports"("slug");

-- CreateIndex
CREATE INDEX "sports_is_active_idx" ON "sports"("is_active");

-- CreateIndex
CREATE INDEX "sport_categories_sport_id_idx" ON "sport_categories"("sport_id");

-- CreateIndex
CREATE UNIQUE INDEX "sport_categories_sport_id_slug_key" ON "sport_categories"("sport_id", "slug");

-- CreateIndex
CREATE INDEX "sport_fields_sport_id_idx" ON "sport_fields"("sport_id");

-- CreateIndex
CREATE INDEX "sport_fields_section_idx" ON "sport_fields"("section");

-- CreateIndex
CREATE INDEX "sport_fields_is_active_idx" ON "sport_fields"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sport_fields_sport_id_section_slug_key" ON "sport_fields"("sport_id", "section", "slug");

-- CreateIndex
CREATE INDEX "sport_field_options_field_id_is_active_idx" ON "sport_field_options"("field_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sport_field_options_field_id_value_key" ON "sport_field_options"("field_id", "value");

-- CreateIndex
CREATE INDEX "player_field_values_profile_id_idx" ON "player_field_values"("profile_id");

-- CreateIndex
CREATE INDEX "player_field_values_field_id_idx" ON "player_field_values"("field_id");

-- CreateIndex
CREATE INDEX "player_field_values_option_id_idx" ON "player_field_values"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_field_values_profile_id_field_id_key" ON "player_field_values"("profile_id", "field_id");

-- CreateIndex
CREATE INDEX "player_sport_profiles_user_id_sport_id_idx" ON "player_sport_profiles"("user_id", "sport_id");

-- CreateIndex
CREATE INDEX "player_sport_profiles_user_id_idx" ON "player_sport_profiles"("user_id");

-- CreateIndex
CREATE INDEX "player_sport_profiles_sport_id_idx" ON "player_sport_profiles"("sport_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_sport_profiles_user_id_sport_id_key" ON "player_sport_profiles"("user_id", "sport_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_sport_category_id_fkey" FOREIGN KEY ("sport_category_id") REFERENCES "sport_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_matches" ADD CONSTRAINT "player_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_matches" ADD CONSTRAINT "player_matches_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_field_values" ADD CONSTRAINT "player_match_field_values_player_match_id_fkey" FOREIGN KEY ("player_match_id") REFERENCES "player_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_field_values" ADD CONSTRAINT "player_match_field_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "sport_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_field_values" ADD CONSTRAINT "player_match_field_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "sport_field_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_categories" ADD CONSTRAINT "sport_categories_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_fields" ADD CONSTRAINT "sport_fields_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_field_options" ADD CONSTRAINT "sport_field_options_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "sport_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_field_values" ADD CONSTRAINT "player_field_values_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "player_sport_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_field_values" ADD CONSTRAINT "player_field_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "sport_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_field_values" ADD CONSTRAINT "player_field_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "sport_field_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_sport_profiles" ADD CONSTRAINT "player_sport_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_sport_profiles" ADD CONSTRAINT "player_sport_profiles_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
