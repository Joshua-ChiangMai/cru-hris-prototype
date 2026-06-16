-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'DOMESTIC_PARTNERSHIP');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN "department" VARCHAR(80),
ADD COLUMN "gender" "Gender",
ADD COLUMN "marital_status" "MaritalStatus";

-- CreateIndex
CREATE INDEX "employees_department_idx" ON "employees"("department");
