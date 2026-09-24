# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

# Copy package files
COPY package.json ./
RUN yarn install --frozen-lockfile --network-timeout 100000 --ignore-engines || yarn install --network-timeout 100000 --ignore-engines

# Stage 2: Builder
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for standalone build
ENV NEXT_OUTPUT_MODE=standalone
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN yarn build

# Stage 3: Runner
FROM node:18-alpine AS runner
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
# Note: outputFileTracingRoot in next.config.js nests standalone output under app/
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone/app ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Prisma CLI (needed to run `prisma db push` on startup). Its runtime deps
# (@prisma/config, @prisma/engines, @prisma/engines-version) are already
# included in the @prisma namespace copied above.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Startup entrypoint: syncs the database schema then starts the server
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Startup admin bootstrap script (creates/ensures the admin account)
COPY --from=builder /app/scripts/ensure-admin.js ./scripts/ensure-admin.js

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
