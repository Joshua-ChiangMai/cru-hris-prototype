-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('STAFF', 'HR', 'ADMIN');

-- CreateEnum
CREATE TYPE "DataScopeType" AS ENUM ('GLOBAL', 'CITY');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "UpdateRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UpdateRequestType" AS ENUM ('PROFILE_UPDATE', 'SENSITIVE_FIELD_UPDATE');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'CANCEL', 'COMMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "scope_type" "DataScopeType" NOT NULL DEFAULT 'GLOBAL',
    "city_id" UUID,
    "assigned_by_user_id" UUID,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "employee_no" VARCHAR(50) NOT NULL,
    "user_id" UUID,
    "city_id" UUID NOT NULL,
    "manager_employee_id" UUID,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "work_email" VARCHAR(255),
    "phone" VARCHAR(30),
    "job_title" VARCHAR(120),
    "employment_status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hire_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_requests" (
    "id" UUID NOT NULL,
    "request_no" VARCHAR(50) NOT NULL,
    "request_type" "UpdateRequestType" NOT NULL DEFAULT 'PROFILE_UPDATE',
    "requester_employee_id" UUID NOT NULL,
    "target_employee_id" UUID NOT NULL,
    "assigned_approver_user_id" UUID,
    "city_id" UUID NOT NULL,
    "status" "UpdateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 0,
    "payload_before" JSONB,
    "payload_after" JSONB NOT NULL,
    "rejection_reason" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "update_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_logs" (
    "id" UUID NOT NULL,
    "update_request_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "from_status" "UpdateRequestStatus",
    "to_status" "UpdateRequestStatus",
    "comment" TEXT,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "correlation_id" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_deleted_at_idx" ON "roles"("deleted_at");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_scope_type_idx" ON "user_roles"("scope_type");

-- CreateIndex
CREATE INDEX "user_roles_city_id_idx" ON "user_roles"("city_id");

-- CreateIndex
CREATE INDEX "user_roles_assigned_by_user_id_idx" ON "user_roles"("assigned_by_user_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_revoked_at_idx" ON "user_roles"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "user_roles_valid_from_valid_to_idx" ON "user_roles"("valid_from", "valid_to");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_scope_type_city_id_key" ON "user_roles"("user_id", "role_id", "scope_type", "city_id");

-- CreateIndex
CREATE UNIQUE INDEX "cities_code_key" ON "cities"("code");

-- CreateIndex
CREATE INDEX "cities_country_code_idx" ON "cities"("country_code");

-- CreateIndex
CREATE INDEX "cities_is_active_idx" ON "cities"("is_active");

-- CreateIndex
CREATE INDEX "cities_deleted_at_idx" ON "cities"("deleted_at");

-- CreateIndex
CREATE INDEX "cities_is_active_deleted_at_idx" ON "cities"("is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_city_id_idx" ON "employees"("city_id");

-- CreateIndex
CREATE INDEX "employees_manager_employee_id_idx" ON "employees"("manager_employee_id");

-- CreateIndex
CREATE INDEX "employees_employment_status_idx" ON "employees"("employment_status");

-- CreateIndex
CREATE INDEX "employees_deleted_at_idx" ON "employees"("deleted_at");

-- CreateIndex
CREATE INDEX "employees_city_id_employment_status_deleted_at_idx" ON "employees"("city_id", "employment_status", "deleted_at");

-- CreateIndex
CREATE INDEX "employees_last_name_first_name_idx" ON "employees"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_no_deleted_at_key" ON "employees"("employee_no", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_work_email_deleted_at_key" ON "employees"("work_email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "update_requests_request_no_key" ON "update_requests"("request_no");

-- CreateIndex
CREATE INDEX "update_requests_status_created_at_idx" ON "update_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "update_requests_requester_employee_id_idx" ON "update_requests"("requester_employee_id");

-- CreateIndex
CREATE INDEX "update_requests_target_employee_id_idx" ON "update_requests"("target_employee_id");

-- CreateIndex
CREATE INDEX "update_requests_assigned_approver_user_id_status_idx" ON "update_requests"("assigned_approver_user_id", "status");

-- CreateIndex
CREATE INDEX "update_requests_city_id_status_idx" ON "update_requests"("city_id", "status");

-- CreateIndex
CREATE INDEX "update_requests_deleted_at_idx" ON "update_requests"("deleted_at");

-- CreateIndex
CREATE INDEX "update_requests_city_id_status_deleted_at_idx" ON "update_requests"("city_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "approval_logs_update_request_id_created_at_idx" ON "approval_logs"("update_request_id", "created_at");

-- CreateIndex
CREATE INDEX "approval_logs_actor_user_id_created_at_idx" ON "approval_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "approval_logs_action_created_at_idx" ON "approval_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "approval_logs_correlation_id_idx" ON "approval_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "approval_logs_created_at_idx" ON "approval_logs"("created_at");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_employee_id_fkey" FOREIGN KEY ("manager_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_requests" ADD CONSTRAINT "update_requests_requester_employee_id_fkey" FOREIGN KEY ("requester_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_requests" ADD CONSTRAINT "update_requests_target_employee_id_fkey" FOREIGN KEY ("target_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_requests" ADD CONSTRAINT "update_requests_assigned_approver_user_id_fkey" FOREIGN KEY ("assigned_approver_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_requests" ADD CONSTRAINT "update_requests_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_update_request_id_fkey" FOREIGN KEY ("update_request_id") REFERENCES "update_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
