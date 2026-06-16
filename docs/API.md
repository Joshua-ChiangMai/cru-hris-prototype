# API Architecture - HRIS P1 Prototype

## API Style

- RESTful API via NestJS controllers.
- Versioned route namespace (`/api/v1`).
- JSON request/response contracts with consistent envelope standards.

## Core Endpoint Groups

- `auth`: authentication and identity context
- `employees`: employee directory and profile operations (`/employees/:id/profile`)
- `families`: family and RC account data
- `approval`: change requests (profile, family, domain-based), approve/reject/cancel
- `reports`: dashboard metrics, statistics, employee report list, CSV export
- `users`: user and role administration

## Contract Principles

- Explicit DTO validation at API boundary.
- Centralized error response format.
- Pagination standards for list endpoints.
- Idempotency expectations for mutation endpoints where applicable.

## Security and Access

- JWT-based auth (`Authorization: Bearer`).
- Global guards: JWT → auth context enrichment → roles → permissions → scope → city access.
- Decorators: `@RequirePermissions`, `@RequireAnyPermission`, `@RequireScope`, `@RequireCityAccess`, `@Roles`, `@Public`.
- Data-scope filters via `RbacService` (OWN / CITY / ALL) on employees, approvals, reports, and users.
- See `docs/RBAC.md` for the permission matrix and scope rules.

## Reports & Dashboard (`/api/v1/reports`)

| Method | Path | Permission | Scope |
|--------|------|------------|-------|
| GET | `/reports/dashboard` | `employee_profile:view` or `approval_center:view` | OWN / CITY / ALL |
| GET | `/reports/statistics` | `reports:view` | CITY, ALL |
| GET | `/reports/headcount` | `reports:view` | CITY, ALL |
| GET | `/reports/approval-summary` | `reports:view` | CITY, ALL |
| GET | `/reports/employees` | `reports:view` | CITY, ALL |
| GET | `/reports/employees/export` | `reports:export` | CITY, ALL |
| POST | `/reports/query` | `reports:view` | CITY, ALL |

Query filters for employee reports: `search`, `cityId`, `employmentStatus`, `page`, `limit`.

### Report filter query (`POST /reports/query`)

Request body:

```json
{
  "filters": [
    { "field": "gender", "value": "MALE" },
    { "field": "familySize", "operator": "gte", "value": 3 }
  ]
}
```

Supported `field` values (all filters are AND-combined; RBAC employee scope is always applied):

| Domain | Field | Operators | Value |
|--------|-------|-----------|-------|
| Employee | `gender` | `eq` (default) | `Gender` enum |
| Employee | `city` | `eq` | City UUID (must be in HR scope) |
| Employee | `maritalStatus` | `eq` | `MaritalStatus` enum |
| Employee | `department` | `eq` | string (department name) |
| Employee | `employmentStatus` | `eq` | `EmploymentStatus` enum |
| Family | `familySize` | `eq`, `gte`, `lte`, `gt`, `lt` | number (active members) |
| Family | `spouseExists` | `eq` | boolean |
| Family | `childrenCount` | `eq`, `gte`, `lte`, `gt`, `lt` | number (sons + daughters) |
| Training | `hasTraining` | `eq` | boolean |
| Training | `trainingCompleted` | `eq` | boolean (at least one `COMPLETED` assignment) |
| Training | `trainingName` | `eq`, `contains` | string (course title) |
| Training | `trainingStatus` | `eq` | `TrainingStatus` enum |

Response: `{ "total", "employees", "summaries" }` (max 5000 rows). `summaries` includes `byGender`, `byCity`, `byMaritalStatus`, and `trainingCompletion` counts scoped to the same filters.

| GET | `/reports/departments` | `reports:view` | CITY, ALL | Distinct departments in scope |

| POST | `/reports/query/export` | `reports:export` | CITY, ALL |

Export body: same as query plus `"format": "csv" | "xlsx"`. Filename: `HRIS_Report_YYYYMMDD.csv` or `.xlsx`.

## P1 Integration Notes

- Frontend consumes backend via stable typed contracts.
- Keep endpoint naming business-oriented and domain-specific.
- Avoid leaking internal persistence model directly to clients.
