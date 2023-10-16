-- CreateTable
CREATE TABLE "organization_notifications" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "textContent" TEXT NOT NULL,
    "symbol" TEXT,
    "link" TEXT,
    "target" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "organization_notifications" ADD CONSTRAINT "organization_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
