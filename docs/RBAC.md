# RBAC Design - HRIS P1 Prototype

## Scope

This RBAC model supports the HRIS P1 Prototype and includes:

- roles: `Staff`, `HR`, `Admin`
- actions: `View`, `Edit`, `Approve`, `Export`, `Delete`
- modules: `Employee Profile`, `Approval Center`, `Reports`, `User Management`

Security requirements enforced:

- Staff can only access own profile
- HR can access employees in own city
- Admin can access all data

---

## 1) Permission Matrix

Legend:

- `Y` = allowed
- `N` = denied
- `Own` = only records owned by current user
- `City` = only records in user's assigned city scope
- `All` = unrestricted across all cities

| Role | Employee Profile | Approval Center | Reports | User Management |
|---|---|---|---|---|
| **Staff** | View: `Own` / Edit: `Own` / Delete: `N` | View: `Own` / Approve: `N` | View: `Own` / Export: `N` | View: `N` / Edit: `N` / Delete: `N` |
| **HR** | View: `City` / Edit: `City` / Delete: `N` | View: `City` / Approve: `City` | View: `City` / Export: `City` | View: `City` / Edit: `City` / Delete: `N` |
| **Admin** | View: `All` / Edit: `All` / Delete: `All` | View: `All` / Approve: `All` | View: `All` / Export: `All` | View: `All` / Edit: `All` / Delete: `All` |

### Canonical permission keys

Use `module:action` keys in token claims and backend checks:

- `employee_profile:view`
- `employee_profile:edit`
- `employee_profile:delete`
- `approval_center:view`
- `approval_center:approve`
- `reports:view`
- `reports:export`
- `user_management:view`
- `user_management:edit`
- `user_management:delete`

---

## 2) Data Scope Strategy

### Scope model

Each authenticated user resolves to exactly one runtime scope:

- `OWN` (Staff)
- `CITY` (HR)
- `ALL` (Admin)

### Scope source of truth

- Role assignment in RBAC tables (`roles`, `user_roles`)
- City scope from:
  - `user_roles.city_id` for scoped role grants
  - fallback to employee profile city (`employees.city_id`) when needed

### Scope resolution rules

1. If role is `Admin`, scope is `ALL`.
2. If role is `HR`, scope is `CITY` with one or more `city_id` values.
3. If role is `Staff`, scope is `OWN` and resource owner must match current user/employee.
4. If user has multiple roles, pick highest privilege for action:
   - `ALL` > `CITY` > `OWN` > `NONE`.

### Enforcement examples

- `GET /employees/{id}`
  - Staff: allowed only when `{id}` maps to own employee.
  - HR: allowed only when employee city in HR city scope.
  - Admin: always allowed.
- `POST /approvals/{id}/approve`
  - Staff: denied.
  - HR: allowed only if request city in HR city scope.
  - Admin: allowed globally.

---

## 3) API Authorization Strategy

### Authorization layers

1. **Authentication layer** (JWT verification)
   - Validate token and load identity (`user_id`, role claims, scoped `city_ids`).

2. **Permission layer** (action-level)
   - Endpoint declares required permission key (e.g. `approval_center:approve`).
   - Request denied with `403` if permission absent.

3. **Data scope layer** (record-level)
   - Build query predicates based on runtime scope:
     - `OWN`: `employee.user_id = current_user_id`
     - `CITY`: `resource.city_id IN token.city_ids`
     - `ALL`: no scope predicate

4. **Audit layer** (security logging)
   - Log denied attempts and privileged mutations (`Approve`, `Export`, `Delete`, role changes).

### Endpoint metadata pattern (NestJS)

Define decorators for explicit contracts:

- `@RequirePermission("employee_profile:view")`
- `@RequirePermission("approval_center:approve")`
- `@RequireScope("OWN|CITY|ALL")` (optional for stricter routes)

### Error model

- `401 Unauthorized`: invalid/missing token
- `403 Forbidden`: permission exists check failed or scope mismatch
- `404 Not Found`: optional concealment for unauthorized record access

---

## 4) Middleware Design Suggestion

### Recommended request pipeline

1. **AuthMiddleware**
   - Validate JWT and attach `request.auth` context:
     - `userId`
     - `roles`
     - `permissions`
     - `cityIds`
     - `scopeLevel`

2. **PermissionGuard** (route guard)
   - Reads `@RequirePermission` metadata.
   - Verifies permission membership from `request.auth.permissions`.

3. **ScopeGuard / ScopeService**
   - For single-record endpoints, verifies owner/city/global access.
   - For list endpoints, injects scope filters into query builder.

4. **AuditMiddleware (post-handler)**
   - Writes audit events for sensitive actions.
   - Captures actor, module, action, target id, result, timestamp.

### Suggested internal interfaces

- `AuthorizationContext`
  - `userId: string`
  - `roles: string[]`
  - `permissions: string[]`
  - `cityIds: string[]`
  - `scopeLevel: "OWN" | "CITY" | "ALL"`

- `ScopePolicy`
  - `buildWhereClause(module, action, context): PrismaWhereInput`
  - `canAccessRecord(module, action, context, record): boolean`

### Security hardening for P1

- Deny-by-default when permission metadata is missing.
- Never trust client-side filters for city/owner checks.
- Recompute scope server-side on every request.
- Add rate-limited security logs for repeated `403` attempts.

---

## P1 Implementation Notes

- Seed required roles: `Staff`, `HR`, `Admin`.
- Seed permission keys listed in this document.
- Assign HR users with explicit `city_id` scopes in `user_roles`.
- Ensure every protected endpoint has both permission check and scope enforcement.

### Code map (implemented)

| Layer | Location |
|---|---|
| Role → permission matrix | `backend/src/common/rbac/role-permissions.ts` |
| Prisma scope filters + city checks | `backend/src/common/services/rbac.service.ts` |
| JWT auth | `backend/src/common/guards/jwt-auth.guard.ts` |
| Scope/city enrichment | `backend/src/common/guards/auth-context.guard.ts` |
| Route permissions | `@RequirePermissions`, `@RequireAnyPermission` |
| Data scope | `@RequireScope`, `ScopeGuard` |
| City param/query guard | `@RequireCityAccess`, `CityAccessGuard` |
| Role guard | `@Roles`, `RolesGuard` |
| Employee / approval filters | `employee-scope.service.ts`, `approval-scope.service.ts` (delegate to `RbacService`) |
| Frontend nav + route guard | `frontend/src/lib/rbac/` |

Global guard order: `JwtAuthGuard` → `AuthContextGuard` → `RolesGuard` → `PermissionsGuard` → `ScopeGuard` → `CityAccessGuard`.
