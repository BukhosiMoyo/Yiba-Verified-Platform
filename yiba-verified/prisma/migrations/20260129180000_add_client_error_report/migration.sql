-- CreateTable
CREATE TABLE "ClientErrorReport" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "digest" TEXT,
    "path" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientErrorReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientErrorReport_created_at_idx" ON "ClientErrorReport"("created_at");

-- CreateIndex
CREATE INDEX "ClientErrorReport_user_id_idx" ON "ClientErrorReport"("user_id");

-- AddForeignKey
ALTER TABLE "ClientErrorReport" ADD CONSTRAINT "ClientErrorReport_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
