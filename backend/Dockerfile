# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl postgresql-client

FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build
# Fail the image build if any DTO still compiles to @IsEnum (requires prisma generate at load time).
RUN if grep -rE 'IsEnum\(' dist/ --include='*.js' 2>/dev/null; then \
      echo "FATAL: compiled output still uses IsEnum(); rebuild DTOs with @IsIn(CONSTANT_VALUES)" >&2; \
      exit 1; \
    fi
RUN grep -q 'IsIn' dist/modules/employees/dto/create-employee.dto.js \
    && ! grep -q 'IsEnum' dist/modules/employees/dto/create-employee.dto.js

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/backend
EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
