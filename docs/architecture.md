# Architecture

```mermaid
flowchart LR
  Browser[Attendee / Organizer / Admin browser] -->|HTTPS, session cookie| Web[Next.js App Router]
  Web --> Pages[Server-rendered pages + interactive client components]
  Web --> API[Route handlers / feature services]
  API --> Auth[Auth and role authorization]
  API --> Events[Event and organizer modules]
  API --> Booking[Booking and inventory module]
  API --> Tickets[Ticket and check-in module]
  API --> Admin[Approval and user management]
  Auth --> DB[(PostgreSQL via Prisma)]
  Events --> DB
  Booking --> DB
  Tickets --> DB
  Admin --> DB
  Events --> Storage[Banner object storage]
  API -. optional transactional email .-> Email[Email provider]
  Browser -. mock payment form; never persist details .-> Booking
```

## Trust boundaries

The browser is untrusted. Authentication, role checks, input validation, availability checks, price calculations, hold expiry, payment simulation status, and check-in mutations must be enforced on the server. Store password hashes only. Mock card/UPI inputs must not be logged or stored. QR payloads should carry an opaque ticket public ID, not personal data; the check-in endpoint must perform a conditional one-time status transition.

## Booking inventory transaction

On hold creation, a database transaction must first release expired pending holds for the selected inventory, then conditionally reserve available capacity and create the pending booking with an expiry timestamp. Payment success confirms the booking and creates one ticket per seat in a transaction. Payment failure or expiry releases reserved inventory exactly once. A uniqueness or conditional update must protect check-in from duplicate scans.

The current implementation contains only the public presentation layer. The module/data design above is a target contract, not implemented API behavior.
