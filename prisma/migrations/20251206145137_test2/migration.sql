/*
  Warnings:

  - You are about to drop the column `name2` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name2",
ADD COLUMN     "name" TEXT;
