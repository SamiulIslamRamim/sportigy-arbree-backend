/*
  Warnings:

  - The values [Right-arm off-break,Right-arm leg-break] on the enum `BowlingStyle` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BowlingStyle_new" AS ENUM ('Right-arm fast', 'Left-arm fast', 'Left-arm spin', 'Right-arm spin', 'None');
ALTER TABLE "cricket_profiles" ALTER COLUMN "bowlingStyle" TYPE "BowlingStyle_new" USING ("bowlingStyle"::text::"BowlingStyle_new");
ALTER TYPE "BowlingStyle" RENAME TO "BowlingStyle_old";
ALTER TYPE "BowlingStyle_new" RENAME TO "BowlingStyle";
DROP TYPE "public"."BowlingStyle_old";
COMMIT;
