# Side Stage project guidance

- This project uses Next.js 16 App Router, TypeScript, and Tailwind CSS. Follow the installed Next.js documentation under `node_modules/next/dist/docs/` before changing framework-specific APIs.
- Keep interactive browser state in client components; database access, authentication, secrets, role checks, price calculation, and booking mutations belong on the server.
- Use PostgreSQL with Prisma for durable data. Preserve transactional inventory reservation and one-time ticket check-in guarantees.
- Never persist mock card/UPI values, passwords in plain text, tokens in localStorage, or production credentials in source control. Use HTTP-only session cookies, password hashes, server validation, and ownership checks.
- Keep product docs in `docs/`. Update the README when setup, environment variables, implemented features, deployment, or test credentials change.
- The app has a local full-stack MVP with auth, event, booking, QR ticket, check-in, and admin event approval routes. These require a configured PostgreSQL database and have not been exercised against a live database; do not claim database-backed behavior or hosting is verified until tested.

## Workspace checklist

- [x] Requirements and project stack identified from the supplied brief.
- [x] Next.js App Router TypeScript scaffold created.
- [x] Responsive discovery, auth, profile, organizer, attendee, and admin screens added.
- [x] Prisma schema/migration, role-based APIs, inventory holds, mock payment, QR tickets/scanner, check-in, and seed script added.
- [x] README, architecture, flow, ER, API contract docs, and `.env.example` kept current.
- [x] Event filter tests, Prisma validation, TypeScript, ESLint, production build, and local homepage smoke test passed.
- [ ] Configure PostgreSQL and secrets, run migrations/seeds, and verify database-backed workflows.
- [ ] Finish password reset/verification, event edits/uploads, profile/admin user UIs, automated tests, and public hosting.
