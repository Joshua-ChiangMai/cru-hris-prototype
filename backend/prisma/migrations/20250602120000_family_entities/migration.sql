-- CreateEnum
CREATE TYPE "FamilyRelationship" AS ENUM ('WORKER', 'SPOUSE', 'SON', 'DAUGHTER', 'PARENT');

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL,
    "rc_number" VARCHAR(30) NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "employee_id" UUID,
    "relationship_type" "FamilyRelationship" NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "families_rc_number_key" ON "families"("rc_number");

-- CreateIndex
CREATE INDEX "families_deleted_at_idx" ON "families"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_employee_id_key" ON "family_members"("employee_id");

-- CreateIndex
CREATE INDEX "family_members_family_id_idx" ON "family_members"("family_id");

-- CreateIndex
CREATE INDEX "family_members_relationship_type_idx" ON "family_members"("relationship_type");

-- CreateIndex
CREATE INDEX "family_members_deleted_at_idx" ON "family_members"("deleted_at");

-- CreateIndex
CREATE INDEX "family_members_family_id_deleted_at_idx" ON "family_members"("family_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
