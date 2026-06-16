# HRIS P1 Prototype — Scope Summary

**HRIS P1 Prototype** aligned with the official HRIS specification.

This document describes what the runnable prototype delivers today. It supersedes earlier “P0-only” descriptions that covered a smaller dashboard-centric slice.

---

## Implemented capabilities

### Authentication

- Email/password login with JWT access and refresh tokens
- Session endpoint with embedded roles, permissions, and data scope
- Protected Next.js routes and NestJS global guards

### RBAC

- Roles: **Staff**, **HR**, **Admin**
- Permissions: `employee_profile:*`, `approval_center:*`, `reports:*`, `user_management:*`
- Scope levels: **OWN** (staff self-service), **CITY** (HR), **ALL** (admin)
- API and UI enforcement aligned with `docs/RBAC.md`

### Employee Management

- Paginated employee directory with search and filters
- Employee detail and self-service **My Profile**
- Manager hierarchy and city assignment
- Employment status and organizational fields

### Family Accounts

- **Family** entity with shared **RC account number**
- Worker employee linked as primary household member
- City-scoped access for HR; own family for staff

### Family Members

- **FamilyMember** records with relationships: Worker, Spouse, Son, Daughter, Parent
- Family Members UI with summary cards and relationship badges
- Family Information page (editable, approval-gated)

### Personal Profile Modules

Eight profile sections with left-side navigation:

1. Basic Information  
2. Contact Information  
3. Worker Information  
4. Team Assignment History  
5. Education Records  
6. Language Skills  
7. Passport Information  
8. Insurance Information  

### Approval Workflow

Per `docs/WORKFLOW.md`:

- Changes to **Personal**, **Contact**, **Family**, and **Passport** information create **PENDING** requests
- HR **Approve** applies `payloadAfter` to production data
- HR **Reject** preserves original data
- **Before/after JSON snapshots** on every request; append-only `approval_logs`

UI:

- **My Requests** (`/approvals/my-requests`)
- **Approval Center** (`/approvals`) — HR pending queue
- **Approval Details** (`/approvals/[id]`)
- **Approval History** (`/approvals/history`)

### Reporting

- Dashboard operational metrics
- Headcount by city
- Employee and approval summaries
- CSV export (permission-gated)

### Demo Seed Data

- 4 cities, 14 demo users, ~53 employees
- 10 family households with mixed dependents
- Profile data for key demo employees
- Approval workflow scenarios (pending, approved, rejected, cancelled)

---

## Explicitly out of scope

| Capability | Notes |
|------------|--------|
| Payroll | Not in specification prototype |
| Marriage merge | Deferred HR data governance |
| AI / predictive reporting | Operational reporting only |
| Financial / ERP integration | No external finance connectors |
| Insurance / Emergency Contacts (full forms) | Navigation placeholders; core data via profile/insurance module |

---

## Specification alignment

| Specification area | Prototype evidence |
|--------------------|-------------------|
| Identity & RBAC | Auth module, guards, scoped APIs |
| Employee / worker records | Employee + worker profile modules |
| Family / RC accounts | Family + FamilyMember entities and UI |
| Profile completeness | Eight profile module tables and tabs |
| Controlled changes | Domain-based approval workflow |
| Operational visibility | Reports and dashboard |

---

## Technical foundation

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS  
- **Backend:** NestJS 11, Prisma 6, PostgreSQL  
- **API prefix:** `/api/v1`  
- **Repository folder:** `hris-p0` (legacy name; product is **HRIS P1 Prototype**)

---

## Related documentation

| File | Purpose |
|------|---------|
| `README.md` | Quick start and demo accounts |
| `docs/PRD.md` | Product breakdown and delivery phases |
| `docs/RBAC.md` | Permission matrix |
| `docs/WORKFLOW.md` | Approval state machine |
| `docs/DATABASE.md` | Entity overview |
| `docs/API.md` | REST conventions |
