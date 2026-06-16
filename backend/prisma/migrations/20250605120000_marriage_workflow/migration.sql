-- CreateEnum
CREATE TYPE "MarriageRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "marriage_requests" (
    "id" UUID NOT NULL,
    "request_no" VARCHAR(50) NOT NULL,
    "requester_employee_id" UUID NOT NULL,
    "spouse_employee_id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "status" "MarriageRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_by_user_id" UUID,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marriage_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marriage_requests_request_no_key" ON "marriage_requests"("request_no");

-- CreateIndex
CREATE INDEX "marriage_requests_status_submitted_at_idx" ON "marriage_requests"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "marriage_requests_requester_employee_id_idx" ON "marriage_requests"("requester_employee_id");

-- CreateIndex
CREATE INDEX "marriage_requests_spouse_employee_id_idx" ON "marriage_requests"("spouse_employee_id");

-- CreateIndex
CREATE INDEX "marriage_requests_city_id_status_idx" ON "marriage_requests"("city_id", "status");

-- AddForeignKey
ALTER TABLE "marriage_requests" ADD CONSTRAINT "marriage_requests_requester_employee_id_fkey" FOREIGN KEY ("requester_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_requests" ADD CONSTRAINT "marriage_requests_spouse_employee_id_fkey" FOREIGN KEY ("spouse_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_requests" ADD CONSTRAINT "marriage_requests_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_requests" ADD CONSTRAINT "marriage_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
