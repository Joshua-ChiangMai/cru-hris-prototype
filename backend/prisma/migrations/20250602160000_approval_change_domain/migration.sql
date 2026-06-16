-- CreateEnum
CREATE TYPE "ApprovalChangeDomain" AS ENUM (
  'PERSONAL_INFORMATION',
  'CONTACT_INFORMATION',
  'FAMILY_INFORMATION',
  'PASSPORT_INFORMATION'
);

-- AlterTable
ALTER TABLE "update_requests" ADD COLUMN "change_domain" "ApprovalChangeDomain";
ALTER TABLE "update_requests" ADD COLUMN "change_summary" VARCHAR(200);

-- CreateIndex
CREATE INDEX "update_requests_change_domain_status_idx" ON "update_requests"("change_domain", "status");
CREATE INDEX "update_requests_target_employee_id_change_domain_status_idx" ON "update_requests"("target_employee_id", "change_domain", "status");
