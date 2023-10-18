/*
  Warnings:

  - You are about to drop the column `topk` on the `organization_rag_tests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organization_rag_tests" DROP COLUMN "topk",
ADD COLUMN     "topK" INTEGER DEFAULT 3;
