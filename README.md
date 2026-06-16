# HRIS P1 Prototype

**HRIS P1 Prototype** aligned with the official HRIS specification.

Runnable monorepo demonstrating enterprise HR operations on Next.js, NestJS, Prisma, and PostgreSQL.

## P1 Scope Summary

The prototype implements the following capabilities against the official HRIS specification:

| Area | Delivered |
|------|-----------|
| **Authentication** | JWT login, refresh, session context (`/auth/me`), protected routes |
| **RBAC** | Staff / HR / Admin roles, permission guards, city and own-scope data access |
| **Employee Management** | Employee directory, profiles, manager hierarchy, city scope |
| **Family Accounts** | Shared RC household accounts linked to worker employees |
| **Family Members** | Dependents with relationship types (Worker, Spouse, Son, Daughter, Parent) |
| **Personal Profile Modules** | Basic, Contact, Worker, Team, Education, Languages, Passport, Insurance |
| **Approval Workflow** | PENDING → Approve/Reject for Personal, Contact, Family, and Passport changes; before/after JSON audit |
| **Reporting** | Dashboard metrics, headcount, operational reports, CSV export |
| **Demo Seed Data** | Cities, users, employees, families, profiles, approval scenarios |

**Out of scope for this prototype:** payroll, marriage merge, AI reporting, financial ERP integration.

See [docs/P1-SCOPE.md](docs/P1-SCOPE.md) for module detail and [docs/](docs/) for architecture references.

---

## Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, TypeScript, TailwindCSS |
| **Backend** | NestJS 11, Prisma 6 |
| **Database** | PostgreSQL (Docker Compose) |

## Project structure

| Path | Purpose |
|------|---------|
| `frontend/` | Next.js admin UI |
| `backend/` | NestJS REST API + Prisma |
| `backend/prisma/` | Schema, migrations, demo seed |
| `docs/` | Product and architecture documentation |
| `docker-compose.yml` | Postgres, backend, frontend services |

---

## Prerequisites

- **Docker Compose** (recommended full stack)
- Or local: Node.js 20+, npm 10+, Docker (Postgres only)

---

## Docker Compose (recommended)

Runs **postgres**, **backend** (with auto-migration), and **frontend** on a shared network.

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if you need custom ports or `JWT_SECRET`.

### 2. Start all services

```bash
docker compose up -d --build
```

Or from npm:

```bash
npm run docker:up
```

### 3. Verify services

```bash
docker compose ps
docker compose logs -f backend
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api/v1 |
| PostgreSQL | `localhost:5432` (user `postgres`, db `hris_p0`) |

### 4. Seed demo data

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Stop stack

```bash
docker compose down
```

---

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment files

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### 3. Start PostgreSQL

```bash
npm run db:up
```

### 4. Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Run apps

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001/api/v1 |

---

## Demo accounts

Password for all demo users: `Password123!`

| Email | Role |
|-------|------|
| `admin@hris.local` | ADMIN (global) |
| `hr1@hris.local` | HR (Jakarta) |
| `hr2@hris.local` | HR (Bangkok) |
| `hr3@hris.local` | HR (Singapore + Chiang Mai) |
| `staff1@hris.local` … `staff10@hris.local` | STAFF |

Full reset (drops DB, re-migrates, re-seeds):

```bash
cd backend && npx prisma migrate reset
```

---

## Key application areas

| Area | Staff | HR / Admin |
|------|-------|------------|
| Dashboard | ✓ | ✓ |
| My Profile (8 profile modules) | ✓ | — |
| Family (Members, Information, …) | ✓ | ✓ (scoped) |
| My Requests / Approval History | ✓ | ✓ |
| Employee List | — | ✓ |
| Approval Center | — | ✓ |
| Reports | — | ✓ |

Frontend route guard: `frontend/src/middleware.ts`. Client RBAC: `frontend/src/lib/rbac/`.

---

## Authentication API

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | Email/password → access + refresh tokens |
| `POST /api/v1/auth/refresh` | Rotate access token |
| `GET /api/v1/auth/me` | Session (roles, permissions, scope) |
| `POST /api/v1/auth/logout` | End session |

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run docker:up` | Build and start full Docker stack |
| `npm run docker:down` | Stop Compose services |
| `npm run docker:logs` | Follow Compose logs |
| `npm run db:up` | Start Postgres only |
| `npm run dev` | Run frontend + backend locally |
| `npm run build` | Production build |
| `npm run prisma:migrate` | Apply migrations |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:seed` | Load demo data |

---

## Environment variables

See `.env.example`. Key values:

| Variable | Description |
|----------|-------------|
| `POSTGRES_*` | Database credentials |
| `DATABASE_URL` | Prisma connection string |
| `JWT_SECRET` | JWT signing secret |
| `NEXT_PUBLIC_API_URL` | Browser API base URL |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/P1-SCOPE.md](docs/P1-SCOPE.md) | P1 prototype scope summary |
| [docs/PRD.md](docs/PRD.md) | Product requirements (historical phases + spec traceability) |
| [docs/RBAC.md](docs/RBAC.md) | Role and permission model |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Approval workflow |
| [docs/DATABASE.md](docs/DATABASE.md) | Data model overview |
| [docs/API.md](docs/API.md) | REST API conventions |
| [backend/prisma/SEED.md](backend/prisma/SEED.md) | Demo seed reference |
