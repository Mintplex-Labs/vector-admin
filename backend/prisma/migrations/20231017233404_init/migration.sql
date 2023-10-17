/*
  Warnings:

  - You are about to drop the column `lastRun` on the `organization_rag_test_runs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organization_rag_test_runs" DROP COLUMN "lastRun";
