-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('EMPLOYEE_PROFILE', 'FAMILY', 'UPDATE_REQUEST');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('UPDATE', 'SUBMIT', 'APPROVE', 'REJECT', 'CANCEL');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" "AuditEntity" NOT NULL,
    "entity_id" UUID,
    "entity_label" VARCHAR(200),
    "before_value" JSONB,
    "after_value" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_created_at_idx" ON "audit_logs"("entity_type", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
