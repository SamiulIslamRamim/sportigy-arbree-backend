/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cricket_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `password_resets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pending_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cricket_profiles" DROP CONSTRAINT "cricket_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "cricket_profiles";

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
