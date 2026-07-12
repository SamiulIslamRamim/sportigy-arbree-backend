/*
  Warnings:

  - Added the required column `academy` to the `cricket_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cricket_profiles" ADD COLUMN     "academy" TEXT NOT NULL;
