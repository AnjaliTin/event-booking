# Side Stage

Side Stage is an event discovery and ticketing platform built with Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL, and Prisma. It includes attendee, organizer, and admin workflows, with a mock-only checkout and QR-coded tickets.

## Current status

Implemented: database-backed event discovery with search/category/city/date/price filters; attendee registration with OTP email verification; login, logout, forgot/reset/change password; bcrypt hashes, signed HTTP-only cookies, role and ownership checks, session invalidation, profile editing and organizer requests; attendee booking/ticket pages; organizer event create/edit, sales dashboard, attendee list and QR scanner; admin event/organizer approvals and user role/suspension controls; atomic inventory holds, mock-only checkout, one QR ticket per seat, cancellation and one-time check-in; and seed data for three roles and ten events. OTP emails require provider configuration; local development exposes a temporary OTP in the UI.

The Neon PostgreSQL database is configured, migrated, and seeded. The app is deployed to Vercel at https://event-booking-nine-bay.vercel.app; the public homepage and events API returned HTTP 200 in smoke checks. Still needed before submission: configure production email delivery and Cloudinary credentials, set up scheduled hold cleanup if desired, run authenticated booking/admin/check-in workflows against production, and complete broader security/end-to-end testing. Vercel Git auto-deploy integration is not connected; deployments currently use the CLI.

## Stack direction

- Next.js 16 App Router and strict TypeScript for the application and future API route handlers.
- PostgreSQL with Prisma for relational event, ticket inventory, booking, and ticket records.
- Custom server-side sessions with signed HTTP-only cookies, bcrypt password hashes, email OTP, and per-route role checks.
- TanStack Query for server data and React Hook Form + Zod for validated forms.
- QR libraries for opaque ticket identifiers/scanning; no payment provider. Mock payment details are kept in the browser and discarded, never sent to the server or stored.
- Vercel for the Next.js application and a managed PostgreSQL provider such as Neon for hosted persistence.

## Run locally

Requirements: Node.js 20.9 or newer, npm, and a PostgreSQL database.

```bash
npm install
Copy-Item .env.example .env
# Set DATABASE_URL and a random AUTH_SECRET (at least 32 characters) in .env.
# Set SEED_TEST_PASSWORD to a unique password of at least 12 characters.
npm run db:generate
npm run db:migrate
npm run db:seed
npm test
npm run dev
```

Open http://localhost:3000. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` before deployment.

## Environment

Set `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, and `SEED_TEST_PASSWORD` in `.env` or the hosting provider's secret settings. For production email verification and password reset, also set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` to a verified sender. Local development without a mail provider returns a development-only OTP in the UI; this never happens in production. Never commit `.env` or production secrets. `.env.example` contains names and safe placeholders only. Set `CRON_SECRET` before configuring a scheduled POST to `/api/v1/bookings/expire` with `Authorization: Bearer <CRON_SECRET>` so abandoned holds are released promptly.

## Demo data

`npm run db:seed` creates `attendee@sidestage.test`, `organizer@sidestage.test`, and `admin@sidestage.test`, plus ten published events in five categories. All three accounts use the value configured in `SEED_TEST_PASSWORD`; change it before sharing test access and never reuse a production password. The homepage loads live records from the API and falls back to local preview data when no database is available.

## Deployment

Live frontend and API: https://event-booking-nine-bay.vercel.app (API routes are served from the same origin). Deployment was verified with the homepage and `/api/v1/events` returning HTTP 200. Production Vercel variables currently include the rotated `DATABASE_URL` and `AUTH_SECRET`. Configure `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` before using production email verification or banner upload. Never put secrets in this file or in source control.

## Documentation

- [Architecture and data model](docs/architecture.md)
- [ER diagram](docs/data-model.md)
- [User and booking flows](docs/flows.md)
- [API contract draft](docs/api.md)
