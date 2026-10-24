# Side Stage

Side Stage is an event discovery and ticketing platform built with Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL, and Prisma. It includes attendee, organizer, and admin workflows, with a mock-only checkout and QR-coded tickets.

## Current status

Implemented: event discovery with search/category/city/date/price filters; attendee registration with OTP email verification; login, logout, forgot/reset/change password; bcrypt hashes, signed HTTP-only cookies, role and ownership checks, session invalidation, profile editing and organizer requests; attendee booking/ticket pages; organizer event create/edit, sales dashboard, attendee list and QR scanner; admin event/organizer approvals and user role/suspension controls; atomic inventory holds, mock-only checkout, one QR ticket per seat, cancellation and one-time check-in; and seed data for three roles and ten events.

The Neon PostgreSQL database is configured, migrated, and seeded. The app is deployed to Vercel at https://event-booking-nine-bay.vercel.app; the public homepage and events API returned HTTP 200 in smoke checks. Production email variables are configured, but email delivery still needs end-to-end verification. Cloudinary variables are not present in the linked production environment, so banner uploads are not ready. On Vercel Hobby, scheduled jobs run at most once per day; expired holds are also released transactionally when a new checkout starts. Authenticated booking, admin, and check-in workflows have not been verified against production. Vercel Git auto-deploy integration is not connected; deployments currently use the CLI.

## Stack

- Next.js 16 App Router and strict TypeScript for the application and API route handlers.
- PostgreSQL with Prisma for relational event, ticket inventory, booking, and ticket records.
- Custom server-side sessions with signed HTTP-only cookies, bcrypt password hashes, email OTP, and per-route role checks.
- TanStack Query for server data and React Hook Form + Zod for validated forms.
- QR libraries for opaque ticket identifiers/scanning; no payment provider. Mock payment details are kept in the browser and discarded, never sent to the server or stored.
- Vercel for the Next.js application and Neon PostgreSQL for hosted persistence.

## Run locally

Requirements: Node.js 20.9 or newer, npm, and a PostgreSQL database.

```powershell
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

Set `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, and `SEED_TEST_PASSWORD` in `.env` or the hosting provider's secret settings. For production email verification and password reset, set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` to a verified sender. Banner uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Scheduled hold cleanup requires a random `CRON_SECRET`; Vercel calls `/api/v1/bookings/expire` daily. Expired holds are also released atomically on new checkout attempts. Local development without a mail provider returns a development-only OTP in the UI; this never happens in production. Never commit `.env` or production secrets. `.env.example` contains names and safe placeholders only.

## Demo data

`npm run db:seed` creates `attendee@sidestage.test`, `organizer@sidestage.test`, and `admin@sidestage.test`, plus ten published events in five categories. All three accounts use the value configured in `SEED_TEST_PASSWORD`; change it before sharing test access and never reuse a production password. The homepage loads live records from the API and falls back to local preview data when no database is available.

## Deployment

Live frontend and API: https://event-booking-nine-bay.vercel.app (API routes are served from the same origin). The homepage and `/api/v1/events` have passed HTTP smoke checks. Production email variables are configured, but signup/reset email delivery and authenticated booking/admin/check-in flows still require live verification. The linked production environment is missing the Cloudinary variables required for uploads. Vercel Hobby cron runs daily, and `vercel.json` schedules the protected hold-expiration endpoint daily. Automated checks currently cover event filtering; full browser end-to-end coverage remains outstanding. Never put secrets in this file or in source control.

## Documentation

- [Architecture and data model](docs/architecture.md)
- [ER diagram](docs/data-model.md)
- [User and booking flows](docs/flows.md)
- [API contract draft](docs/api.md)
