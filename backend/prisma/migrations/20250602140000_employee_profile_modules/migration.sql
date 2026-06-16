-- CreateEnum
CREATE TYPE "WorkerType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERN', 'VOLUNTEER', 'CONTRACT');
CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED');
CREATE TYPE "LanguageProficiency" AS ENUM ('BASIC', 'CONVERSATIONAL', 'FLUENT', 'NATIVE');

-- CreateTable
CREATE TABLE "employee_basic_info" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "preferred_name" VARCHAR(100),
    "date_of_birth" DATE,
    "citizenship" VARCHAR(80),
    "rc_number" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_basic_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_contact_info" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "primary_address_line1" VARCHAR(200),
    "primary_address_line2" VARCHAR(200),
    "primary_city" VARCHAR(100),
    "primary_state" VARCHAR(80),
    "primary_postal_code" VARCHAR(20),
    "primary_country" VARCHAR(80),
    "mailing_address_line1" VARCHAR(200),
    "mailing_address_line2" VARCHAR(200),
    "mailing_city" VARCHAR(100),
    "mailing_state" VARCHAR(80),
    "mailing_postal_code" VARCHAR(20),
    "mailing_country" VARCHAR(80),
    "phone_primary" VARCHAR(30),
    "phone_secondary" VARCHAR(30),
    "email_primary" VARCHAR(255),
    "email_secondary" VARCHAR(255),
    "signal_account" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_contact_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_worker_info" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "worker_type" "WorkerType",
    "worker_status" "WorkerStatus",
    "intern_start_date" DATE,
    "ministry_join_date" DATE,
    "worker_join_date" DATE,
    "termination_date" DATE,
    "sending_region" VARCHAR(120),
    "salary_source" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_worker_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_team_assignments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "team" VARCHAR(120) NOT NULL,
    "position" VARCHAR(120) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "employee_team_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_education" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "degree" VARCHAR(120) NOT NULL,
    "major" VARCHAR(120),
    "school" VARCHAR(200) NOT NULL,
    "graduation_year" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "employee_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_language_skills" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "language" VARCHAR(80) NOT NULL,
    "proficiency" "LanguageProficiency" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "employee_language_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_passports" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "passport_number" VARCHAR(50) NOT NULL,
    "country" VARCHAR(80) NOT NULL,
    "issue_date" DATE,
    "expiry_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "employee_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_insurance" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "insurance_provider" VARCHAR(120) NOT NULL,
    "policy_number" VARCHAR(80) NOT NULL,
    "effective_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "employee_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_basic_info_employee_id_key" ON "employee_basic_info"("employee_id");
CREATE UNIQUE INDEX "employee_contact_info_employee_id_key" ON "employee_contact_info"("employee_id");
CREATE UNIQUE INDEX "employee_worker_info_employee_id_key" ON "employee_worker_info"("employee_id");
CREATE INDEX "employee_team_assignments_employee_id_idx" ON "employee_team_assignments"("employee_id");
CREATE INDEX "employee_team_assignments_employee_id_deleted_at_idx" ON "employee_team_assignments"("employee_id", "deleted_at");
CREATE INDEX "employee_education_employee_id_idx" ON "employee_education"("employee_id");
CREATE INDEX "employee_education_employee_id_deleted_at_idx" ON "employee_education"("employee_id", "deleted_at");
CREATE INDEX "employee_language_skills_employee_id_idx" ON "employee_language_skills"("employee_id");
CREATE INDEX "employee_language_skills_employee_id_deleted_at_idx" ON "employee_language_skills"("employee_id", "deleted_at");
CREATE INDEX "employee_passports_employee_id_idx" ON "employee_passports"("employee_id");
CREATE INDEX "employee_passports_employee_id_deleted_at_idx" ON "employee_passports"("employee_id", "deleted_at");
CREATE INDEX "employee_insurance_employee_id_idx" ON "employee_insurance"("employee_id");
CREATE INDEX "employee_insurance_employee_id_deleted_at_idx" ON "employee_insurance"("employee_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "employee_basic_info" ADD CONSTRAINT "employee_basic_info_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_contact_info" ADD CONSTRAINT "employee_contact_info_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_worker_info" ADD CONSTRAINT "employee_worker_info_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_team_assignments" ADD CONSTRAINT "employee_team_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_education" ADD CONSTRAINT "employee_education_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_language_skills" ADD CONSTRAINT "employee_language_skills_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_passports" ADD CONSTRAINT "employee_passports_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_insurance" ADD CONSTRAINT "employee_insurance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
