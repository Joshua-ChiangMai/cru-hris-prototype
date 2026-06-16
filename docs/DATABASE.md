# Database Design - HRIS P1 Prototype (PostgreSQL + Prisma)

## Scope and Goals

This schema supports the **HRIS P1 Prototype**, aligned with the official HRIS specification:

- RBAC and city-based data scope
- Employee master and extended profile modules
- Family accounts and family members
- Approval workflow with before/after JSON snapshots
- Immutable approval audit trail

Core tables include:

- `users`, `roles`, `user_roles`
- `employees`, `cities`
- `families`, `family_members`
- `employee_basic_info`, `employee_contact_info`, `employee_worker_info`
- `employee_team_assignments`, `employee_education`, `employee_language_skills`
- `employee_passports`, `employee_insurance`
- `update_requests`, `approval_logs`

See `docs/P1-SCOPE.md` for the full P1 capability list.

---

## 1) ER Relationship Explanation

### Core entities and relationships

1. `users` is the identity/authentication root.
   - One `users` row can map to one `employees` row (`employees.user_id` unique).
   - One `users` row can have many `user_roles` rows.

2. `roles` defines authorization roles (`SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`).
   - One `roles` row can be assigned to many users via `user_roles`.

3. `user_roles` is the RBAC assignment bridge.
   - Many-to-many between `users` and `roles`.
   - Includes optional `city_id` to enforce city-scoped access.
   - Example: manager may have role access only for `city_id = 3`.

4. `cities` is the geographic scope master data.
   - One city can be referenced by many employees (`employees.city_id`).
   - One city can scope many user role assignments (`user_roles.city_id`).
   - One city can scope update requests (`update_requests.city_id`).

5. `employees` stores HR master profile data.
   - Belongs to one city.
   - Self-reference for reporting line via `manager_employee_id`.
   - Optional one-to-one link to `users`.
   - Can create many `update_requests`.

6. `update_requests` stores approval workflow requests (for profile/data updates).
   - Created by one employee (`requester_employee_id`).
   - Scoped to one city (`city_id`).
   - Assigned to one approver user (`assigned_approver_user_id`).
   - Has many immutable `approval_logs`.

7. `approval_logs` is the workflow audit/event trail.
   - Each log belongs to one request.
   - Each log captures actor user, action, status transition, and optional comment.
   - Append-only pattern for compliance traceability.

### Cardinality summary

- `users` 1 --- * `user_roles` * --- 1 `roles`
- `cities` 1 --- * `employees`
- `cities` 1 --- * `user_roles` (optional scope)
- `employees` 1 --- * `update_requests`
- `update_requests` 1 --- * `approval_logs`
- `employees` * --- 1 `employees` (manager hierarchy)
- `users` 1 --- 0..1 `employees`

---

## 2) Database Table Definitions

### 2.1 `users`

Purpose: authentication identity + system actor.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `email` | VARCHAR(255) | unique, not null |
| `password_hash` | TEXT | not null |
| `status` | VARCHAR(20) | not null, default `ACTIVE` |
| `last_login_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | not null, default now |
| `updated_at` | TIMESTAMPTZ | not null, default now |

Indexes:
- unique index on `email`
- index on `status`

---

### 2.2 `roles`

Purpose: RBAC role dictionary.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `code` | VARCHAR(50) | unique, not null |
| `name` | VARCHAR(100) | not null |
| `description` | TEXT | nullable |
| `is_system` | BOOLEAN | not null, default true |
| `created_at` | TIMESTAMPTZ | not null, default now |
| `updated_at` | TIMESTAMPTZ | not null, default now |

Indexes:
- unique index on `code`

---

### 2.3 `user_roles`

Purpose: user-role assignment with optional city scope.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `user_id` | UUID | FK -> `users.id`, not null |
| `role_id` | UUID | FK -> `roles.id`, not null |
| `city_id` | UUID | FK -> `cities.id`, nullable (null = global scope) |
| `assigned_by_user_id` | UUID | FK -> `users.id`, nullable |
| `created_at` | TIMESTAMPTZ | not null, default now |

Constraints:
- unique (`user_id`, `role_id`, `city_id`) to avoid duplicate scoped grants

Indexes:
- index on `user_id`
- index on `role_id`
- index on `city_id`

---

### 2.4 `cities`

Purpose: city master for geographic partitioning and access scope.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `code` | VARCHAR(20) | unique, not null |
| `name` | VARCHAR(100) | not null |
| `country_code` | CHAR(2) | not null |
| `is_active` | BOOLEAN | not null, default true |
| `created_at` | TIMESTAMPTZ | not null, default now |
| `updated_at` | TIMESTAMPTZ | not null, default now |

Indexes:
- unique index on `code`
- index on `country_code`

---

### 2.5 `employees`

Purpose: employee master profile and org reporting line.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `employee_no` | VARCHAR(50) | unique, not null |
| `user_id` | UUID | FK -> `users.id`, unique, nullable |
| `city_id` | UUID | FK -> `cities.id`, not null |
| `manager_employee_id` | UUID | FK -> `employees.id`, nullable |
| `first_name` | VARCHAR(100) | not null |
| `last_name` | VARCHAR(100) | not null |
| `work_email` | VARCHAR(255) | unique, nullable |
| `phone` | VARCHAR(30) | nullable |
| `job_title` | VARCHAR(120) | nullable |
| `employment_status` | VARCHAR(20) | not null, default `ACTIVE` |
| `hire_date` | DATE | nullable |
| `created_at` | TIMESTAMPTZ | not null, default now |
| `updated_at` | TIMESTAMPTZ | not null, default now |

Indexes:
- unique index on `employee_no`
- index on `city_id`
- index on `manager_employee_id`
- index on `employment_status`

---

### 2.6 `update_requests`

Purpose: approval workflow request header for employee updates.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `request_no` | VARCHAR(50) | unique, not null |
| `request_type` | VARCHAR(50) | not null (e.g., `PROFILE_UPDATE`) |
| `requester_employee_id` | UUID | FK -> `employees.id`, not null |
| `target_employee_id` | UUID | FK -> `employees.id`, not null |
| `assigned_approver_user_id` | UUID | FK -> `users.id`, nullable |
| `city_id` | UUID | FK -> `cities.id`, not null |
| `status` | VARCHAR(20) | not null (`DRAFT`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`) |
| `payload_before` | JSONB | nullable |
| `payload_after` | JSONB | not null |
| `submitted_at` | TIMESTAMPTZ | nullable |
| `resolved_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | not null, default now |
| `updated_at` | TIMESTAMPTZ | not null, default now |

Indexes:
- unique index on `request_no`
- index on `status`
- index on `requester_employee_id`
- index on `assigned_approver_user_id`
- index on `city_id`

---

### 2.7 `approval_logs`

Purpose: immutable audit trail for each approval request transition.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `update_request_id` | UUID | FK -> `update_requests.id`, not null |
| `actor_user_id` | UUID | FK -> `users.id`, not null |
| `action` | VARCHAR(30) | not null (`SUBMIT`, `REVIEW`, `APPROVE`, `REJECT`, `CANCEL`, `COMMENT`) |
| `from_status` | VARCHAR(20) | nullable |
| `to_status` | VARCHAR(20) | nullable |
| `comment` | TEXT | nullable |
| `metadata` | JSONB | nullable |
| `created_at` | TIMESTAMPTZ | not null, default now |

Indexes:
- index on `update_request_id`
- index on `actor_user_id`
- index on `created_at`

Audit rule:
- Rows are append-only at application level (no updates/deletes except regulated admin maintenance).

---

## 3) Prisma Schema Draft

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  LOCKED
}

enum EmploymentStatus {
  ACTIVE
  INACTIVE
  TERMINATED
}

enum RequestStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
  CANCELLED
}

enum ApprovalAction {
  SUBMIT
  REVIEW
  APPROVE
  REJECT
  CANCEL
  COMMENT
}

model User {
  id           String      @id @default(uuid()) @db.Uuid
  email        String      @unique @db.VarChar(255)
  passwordHash String      @map("password_hash") @db.Text
  status       UserStatus  @default(ACTIVE)
  lastLoginAt  DateTime?   @map("last_login_at") @db.Timestamptz(6)
  createdAt    DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)

  employee              Employee?
  userRoles             UserRole[]
  assignedRoleGrants    UserRole[]      @relation("AssignedByUser")
  assignedApprovals     UpdateRequest[] @relation("AssignedApprover")
  approvalLogsAsActor   ApprovalLog[]

  @@map("users")
  @@index([status])
}

model Role {
  id          String    @id @default(uuid()) @db.Uuid
  code        String    @unique @db.VarChar(50)
  name        String    @db.VarChar(100)
  description String?   @db.Text
  isSystem    Boolean   @default(true) @map("is_system")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  userRoles UserRole[]

  @@map("roles")
}

model UserRole {
  id               String    @id @default(uuid()) @db.Uuid
  userId           String    @map("user_id") @db.Uuid
  roleId           String    @map("role_id") @db.Uuid
  cityId           String?   @map("city_id") @db.Uuid
  assignedByUserId String?   @map("assigned_by_user_id") @db.Uuid
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           Role    @relation(fields: [roleId], references: [id], onDelete: Restrict)
  city           City?   @relation(fields: [cityId], references: [id], onDelete: SetNull)
  assignedByUser User?   @relation("AssignedByUser", fields: [assignedByUserId], references: [id], onDelete: SetNull)

  @@map("user_roles")
  @@unique([userId, roleId, cityId])
  @@index([userId])
  @@index([roleId])
  @@index([cityId])
}

model City {
  id          String    @id @default(uuid()) @db.Uuid
  code        String    @unique @db.VarChar(20)
  name        String    @db.VarChar(100)
  countryCode String    @map("country_code") @db.Char(2)
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  employees      Employee[]
  userRoles      UserRole[]
  updateRequests UpdateRequest[]

  @@map("cities")
  @@index([countryCode])
}

model Employee {
  id                String            @id @default(uuid()) @db.Uuid
  employeeNo        String            @unique @map("employee_no") @db.VarChar(50)
  userId            String?           @unique @map("user_id") @db.Uuid
  cityId            String            @map("city_id") @db.Uuid
  managerEmployeeId String?           @map("manager_employee_id") @db.Uuid
  firstName         String            @map("first_name") @db.VarChar(100)
  lastName          String            @map("last_name") @db.VarChar(100)
  workEmail         String?           @unique @map("work_email") @db.VarChar(255)
  phone             String?           @db.VarChar(30)
  jobTitle          String?           @map("job_title") @db.VarChar(120)
  employmentStatus  EmploymentStatus  @default(ACTIVE) @map("employment_status")
  hireDate          DateTime?         @map("hire_date") @db.Date
  createdAt         DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  user              User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  city              City              @relation(fields: [cityId], references: [id], onDelete: Restrict)
  manager           Employee?         @relation("EmployeeManager", fields: [managerEmployeeId], references: [id], onDelete: SetNull)
  directReports     Employee[]        @relation("EmployeeManager")
  requestedUpdates  UpdateRequest[]   @relation("RequesterEmployee")
  targetUpdates     UpdateRequest[]   @relation("TargetEmployee")

  @@map("employees")
  @@index([cityId])
  @@index([managerEmployeeId])
  @@index([employmentStatus])
}

model UpdateRequest {
  id                     String         @id @default(uuid()) @db.Uuid
  requestNo              String         @unique @map("request_no") @db.VarChar(50)
  requestType            String         @map("request_type") @db.VarChar(50)
  requesterEmployeeId    String         @map("requester_employee_id") @db.Uuid
  targetEmployeeId       String         @map("target_employee_id") @db.Uuid
  assignedApproverUserId String?        @map("assigned_approver_user_id") @db.Uuid
  cityId                 String         @map("city_id") @db.Uuid
  status                 RequestStatus  @default(DRAFT)
  payloadBefore          Json?          @map("payload_before")
  payloadAfter           Json           @map("payload_after")
  submittedAt            DateTime?      @map("submitted_at") @db.Timestamptz(6)
  resolvedAt             DateTime?      @map("resolved_at") @db.Timestamptz(6)
  createdAt              DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  requesterEmployee Employee      @relation("RequesterEmployee", fields: [requesterEmployeeId], references: [id], onDelete: Restrict)
  targetEmployee    Employee      @relation("TargetEmployee", fields: [targetEmployeeId], references: [id], onDelete: Restrict)
  assignedApprover  User?         @relation("AssignedApprover", fields: [assignedApproverUserId], references: [id], onDelete: SetNull)
  city              City          @relation(fields: [cityId], references: [id], onDelete: Restrict)
  approvalLogs      ApprovalLog[]

  @@map("update_requests")
  @@index([status])
  @@index([requesterEmployeeId])
  @@index([assignedApproverUserId])
  @@index([cityId])
}

model ApprovalLog {
  id              String          @id @default(uuid()) @db.Uuid
  updateRequestId String          @map("update_request_id") @db.Uuid
  actorUserId     String          @map("actor_user_id") @db.Uuid
  action          ApprovalAction
  fromStatus      RequestStatus?  @map("from_status")
  toStatus        RequestStatus?  @map("to_status")
  comment         String?         @db.Text
  metadata        Json?
  createdAt       DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)

  updateRequest UpdateRequest @relation(fields: [updateRequestId], references: [id], onDelete: Cascade)
  actorUser     User          @relation(fields: [actorUserId], references: [id], onDelete: Restrict)

  @@map("approval_logs")
  @@index([updateRequestId])
  @@index([actorUserId])
  @@index([createdAt])
}
```

---

## Implementation Notes (P1)

- Seed required roles on first migration: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`.
- Use `user_roles.city_id IS NULL` as global access; non-null means city-scoped access.
- Enforce approval state transitions in application service layer and log every transition in `approval_logs`.
- Use transaction boundaries for approve/reject operations (`update_requests` update + `approval_logs` insert).
