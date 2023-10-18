-- CreateTable
CREATE TABLE "organization_rag_tests" (
    "id" SERIAL NOT NULL,
    "frequencyType" TEXT NOT NULL,
    "promptText" TEXT,
    "promptVector" DOUBLE PRECISION[],
    "topK" INTEGER DEFAULT 3,
    "comparisons" JSONB[],
    "lastRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" INTEGER NOT NULL,
    "workspace_id" INTEGER NOT NULL,

    CONSTRAINT "organization_rag_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_rag_test_runs" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rag_test_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "workspace_id" INTEGER NOT NULL,

    CONSTRAINT "organization_rag_test_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "organization_rag_tests" ADD CONSTRAINT "organization_rag_tests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_rag_tests" ADD CONSTRAINT "organization_rag_tests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organization_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_rag_test_runs" ADD CONSTRAINT "organization_rag_test_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_rag_test_runs" ADD CONSTRAINT "organization_rag_test_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organization_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_rag_test_runs" ADD CONSTRAINT "organization_rag_test_runs_rag_test_id_fkey" FOREIGN KEY ("rag_test_id") REFERENCES "organization_rag_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
