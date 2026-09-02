#!/bin/sh
set -e

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
  echo "[binawf] first boot — seeding initial content..."
  ./node_modules/.bin/tsx prisma/seed.ts
fi

echo "[binawf] starting Next.js on :$PORT"
exec ./node_modules/.bin/next start -p "$PORT"
