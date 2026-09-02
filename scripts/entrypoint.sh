#!/bin/sh
set -e

echo "[binawf] boot (NODE_ENV=${NODE_ENV:-development})"

# ---- Security gates (production) ----
if [ "$NODE_ENV" = "production" ]; then
  if [ -z "$SESSION_SECRET" ] || [ "${#SESSION_SECRET}" -lt 32 ]; then
    echo "[binawf] ERROR: SESSION_SECRET must be set and be 32+ characters in production." >&2
    echo "[binawf] Generate one with: openssl rand -hex 32   (see .env.example)" >&2
    exit 1
  fi
fi

echo "[binawf] waiting for database..."
up=0
for i in $(seq 1 40); do
  if node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env['DATABASE_URL'] }); c.connect().then(() => process.exit(0)).catch(() => process.exit(1));"; then
    up=1
    break
  fi
  echo "[binawf] database not ready ($i/40), retrying in 3s..."
  sleep 3
done

if [ "$up" != "1" ]; then
  echo "[binawf] FATAL: database unreachable after 120s"
  exit 1
fi

echo "[binawf] applying migrations..."
./node_modules/.bin/prisma migrate deploy

# Seed ONLY on a fresh database (no admin user yet) so later restarts never
# wipe admin edits to navigation / homepage sections.
count=$(node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env['DATABASE_URL'] }); c.connect().then(async () => { try { const r = await c.query('SELECT count(*)::int AS n FROM users'); console.log(r.rows[0].n); } catch { console.log('-1'); } await c.end(); });")
echo "[binawf] existing users: ${count:-unknown}"

if [ "${count:-x}" = "0" ]; then
  if [ "$NODE_ENV" = "production" ]; then
    pw="${ADMIN_PASSWORD:-}"
    if [ -z "$pw" ] || [ "${#pw}" -lt 12 ] || [ "$pw" = "Binawf2026!" ]; then
      echo "[binawf] ERROR: on a fresh database in production you must set ADMIN_EMAIL and" >&2
      echo "[binawf] ADMIN_PASSWORD (>= 12 chars, NOT the documented default 'Binawf2026!')." >&2
      exit 1
    fi
  fi
  echo "[binawf] first boot — seeding initial content..."
  ./node_modules/.bin/tsx prisma/seed.ts
fi

echo "[binawf] starting Next.js on :$PORT"
exec ./node_modules/.bin/next start -p "$PORT"
