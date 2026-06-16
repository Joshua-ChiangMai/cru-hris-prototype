# Docker — HRIS P1 Prototype

See root [README.md](../README.md) for full startup instructions.

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

## Services

| Service   | Host URL                         | Internal hostname |
|-----------|----------------------------------|-------------------|
| Frontend  | http://localhost:3000            | `frontend`        |
| Backend   | http://localhost:3001/api/v1     | `backend`         |
| Postgres  | localhost:5432                   | `postgres`        |

Backend connects to Postgres via Docker network DNS (`postgres:5432`). Migrations run automatically on backend startup (`prisma migrate deploy`).
