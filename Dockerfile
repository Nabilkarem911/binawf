# syntax=docker/dockerfile:1
# ============ BUILDER ============
FROM node:22-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CI=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# prisma.config.ts reads DATABASE_URL via env() — generate only needs a resolvable
# (dummy) value, the REAL URL comes from the container env at runtime.
RUN DATABASE_URL="postgresql://dummy:dummy@127.0.0.1:5432/dummy" ./node_modules/.bin/prisma generate

# NEXT_PUBLIC_* vars are baked at build time — production URL must be the real one.
ARG NEXT_PUBLIC_SITE_URL=https://binawf.orcanox.xyz
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

# ============ RUNNER ============
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    HOME=/tmp \
    NEXT_TELEMETRY_DISABLED=1

RUN groupadd -r nextjs && useradd -r -g nextjs nextjs

# Full copy: `next start` + the boot-time prisma CLI need the whole node_modules
# (no standalone pruning traps).
COPY --from=builder /app/ ./
RUN chown -R nextjs:nextjs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=20 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "/app/scripts/entrypoint.sh"]
