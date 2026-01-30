-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_info" TEXT,
    "location" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivityLog_user_id_idx" ON "UserActivityLog"("user_id");

-- CreateIndex
CREATE INDEX "UserActivityLog_activity_type_idx" ON "UserActivityLog"("activity_type");

-- CreateIndex
CREATE INDEX "UserActivityLog_created_at_idx" ON "UserActivityLog"("created_at");

-- CreateIndex
CREATE INDEX "UserActivityLog_user_id_created_at_idx" ON "UserActivityLog"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
