-- AddForeignKey
ALTER TABLE "Facilitator" ADD CONSTRAINT "Facilitator_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
