<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Notes

## Build and Run

- `npm run dev` — Start Next.js development server.
- `npm run build` — Create an optimized production build.
- `npm run start` — Start production server (run build first).
- `npm run lint` — Run ESLint.

## Database

- Uses PostgreSQL. Ensure `DATABASE_URL` in `.env` is set.
- `npm run db:generate` — Generate Prisma client.
- `npm run db:migrate` — Run migrations.
- `npm run db:seed` — Seed the database with the initial site structure.
- `npm run db:studio` — Open Prisma Studio.

## Admin Access

Default admin is created by the seed script.
- Email: `admin@binawf.local`
- Password: `Binawf2026!` (change immediately in production).

## Important Conventions

- App Router with server components by default.
- Arabic RTL layout. Root `html` uses `lang="ar"` and `dir="rtl"`.
- Use `prisma.config.ts` for Prisma CLI configuration and `.env` for secrets.
- Admin routes are under `/admin`. Public routes use the catch-all `[...slug]` dynamic route.
