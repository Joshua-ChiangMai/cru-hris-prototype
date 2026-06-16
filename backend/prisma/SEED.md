# HRIS P1 Prototype — Demo seed

Enterprise-quality demo data for presentations and RBAC testing.

## What gets created

| Dataset | Count |
|---------|-------|
| Cities | 4 (Jakarta, Chiang Mai, Bangkok, Singapore) |
| Users | 14 (1 admin, 3 HR, 10 staff) |
| Employees | ~51 (linked logins + bulk workforce) |
| Update requests | 30 (12 pending, 10 approved, 6 rejected, 2 cancelled) |

Employee profiles include department, gender, marital status, employment status, hire date, phone, and city.

Approval payloads demonstrate phone, address, passport, and work-email change scenarios.

## Prerequisites

- PostgreSQL running (`npm run db:up` or full Docker stack)
- `backend/.env` with valid `DATABASE_URL`

## Run seed

From repository root:

```bash
npm run prisma:generate
cd backend && npx prisma migrate deploy && cd ..
npm run prisma:seed
```

## Full reset (destructive)

Drops the database, reapplies migrations, and runs seed:

```bash
cd backend && npx prisma migrate reset --force
```

## Demo passwords

All accounts use: **`Password123!`**

| Account | Role |
|---------|------|
| `admin@hris.local` | Admin (global) |
| `hr1@hris.local` | HR — Jakarta |
| `hr2@hris.local` | HR — Bangkok |
| `hr3@hris.local` | HR — Singapore + Chiang Mai |
| `staff1@hris.local` … `staff10@hris.local` | Staff |

## Verify after seed

```bash
cd backend && npx prisma studio
```

Or call the dashboard API as HR:

```bash
curl -s http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr1@hris.local","password":"Password123!"}'
```
