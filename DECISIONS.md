# Project Decisions — موهبة فنان CMS

## Stack

- **Next.js 16.3.4** — latest stable App Router, Server Components, Route Handlers.
- **React 19.2.8 / React DOM 19.2.8** — stable, bundled with Next.js 16.
- **TypeScript 5** — strict mode enabled.
- **Tailwind CSS 4** — utility-first styling with `@tailwindcss/postcss`.
- **shadcn/ui (Base UI)** — accessible, composable UI primitives installed via `npx shadcn`.
- **Prisma ORM 7.10.0 + @prisma/client 7.10.0** — stable release chosen over Prisma 8.0.0-RC.12 (platform/Composer CLI pre-release) for production reliability.
- **PostgreSQL 16** — relational database running in Docker locally; any Postgres provider works in production.
- **iron-session 9** — lightweight, encrypted cookie-based sessions.
- **bcryptjs** — password hashing.
- **zod** — schema validation.
- **@prisma/adapter-pg + pg** — driver adapter for Prisma 7.

## Why Prisma 7.10.0 instead of Prisma 8.0.0-RC.12

The `npx create-next-app` / `npm install` initially resolved `prisma@8.0.0-rc.12`, which is the new Prisma Platform/Composer CLI, not the stable Prisma ORM. To keep the stack stable and avoid a brand-new pre-release framework, I pinned both `prisma` (CLI/generator) and `@prisma/client` to the latest stable ORM release, `7.10.0`, and use the standard `prisma/schema.prisma` + `prisma.config.ts` workflow.

## Architecture

- **Unified content model**: `User`, `Category` (hierarchical), `Post` (type-driven: page, article, news, announcement, project, lesson, research, award, achievement, gallery, event, virtual exhibition), `Media`, `NavigationItem`, `HomepageSection`, `SiteSetting`, `ActivityLog`.
- **Polymorphic `Post` type** with a `metadata` JSON field covers per-type fields (year, term, grade, eventDate, videoUrl, externalUrl, studentName, etc.).
- **Galleries** are `Post`s of type `GALLERY` with linked `Media` rows through `PostMedia`.
- **Media library** is a single `Media` table reused by posts, categories, and homepage sections.
- **Dynamic public routing** via `[...slug]` serves category indexes and post details from the CMS.
- **Admin dashboard** under `/admin` with route-group layout, protected by server-side auth checks.
- **Authentication** via iron-session sealed cookies. Login is a JSON route handler; logout is a server action.
- **File storage** uses `/public/uploads` in development; intended to be swapped for an S3-compatible bucket or CDN in production.

## Security

- `SESSION_SECRET` and `ADMIN_*` credentials stored in `.env` (gitignored).
- Passwords hashed with bcrypt (10 rounds).
- Admin routes and mutations call `requireAuth()`.
- API routes validate sessions before destructive operations.
- HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) configured in `next.config.ts`.
- Robots.txt disallows `/admin`; sitemap is generated from published content.

## Design

- **RTL Arabic-first**: `dir="rtl"` on `<html>`, Arabic locale `ar`, `Noto Sans Arabic` font.
- **Design system** based on `stone` base color for a warm, educational, premium feel.
- **Responsive** header with desktop navigation and a mobile sheet menu.
- **No Lorem Ipsum / fake content**: real project titles and structure migrated; content bodies are left for the admin to fill, with clear empty states.
