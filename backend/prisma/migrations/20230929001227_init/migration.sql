/*
  Warnings:

  - Added the required column `fname` to the `organization_workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organization_workspaces" ADD COLUMN     "fname" TEXT NOT NULL;
