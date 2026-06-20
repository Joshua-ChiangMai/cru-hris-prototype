#!/bin/sh
set -e

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-hris_p0}"

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready."

# Prisma CLI is hoisted to /app/node_modules in the npm workspace layout.
PRISMA_BIN="/app/node_modules/.bin/prisma"

echo "Generating Prisma client..."
"$PRISMA_BIN" generate

echo "Running Prisma migrations..."
"$PRISMA_BIN" migrate deploy

echo "Starting NestJS application..."
exec "$@"
