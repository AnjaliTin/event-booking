# API contract draft

Routes below are implemented Next.js route handlers under `/api/v1` unless marked pending. Every request and response uses JSON. Error responses use `{ "error": { "code": "...", "message": "...", "fields": {} } }`. Protected handlers authenticate server-side and enforce ownership/role checks.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an attendee account with validated, hashed password |
| POST | `/auth/login` | Public | Verify credentials and set HTTP-only session cookie |
| POST | `/auth/logout` | Signed in | Revoke session and clear cookie |
| POST | `/auth/verify-email` | Public with OTP | Verify email and establish session |
| POST | `/auth/resend-verification` | Public | Resend a rate-limited verification OTP |
| POST | `/auth/forgot-password` | Public | Return generic response and send OTP if account exists |
| POST | `/auth/reset-password` | Public with OTP | Reset password and invalidate prior sessions |
| POST | `/auth/change-password` | Signed in | Verify current password, update hash, invalidate prior sessions |
| GET/PATCH/POST | `/profile` | Signed in | Read/update own name/avatar or request organizer access |
| GET | `/events` | Public | Search, filter, sort published events; query: `q`, `category`, `city`, `from`, `to`, `minPrice`, `maxPrice`, `sort` |
| GET | `/events/{eventId}` | Public/owner/admin | Public detail or non-public detail for event owner/admin |
| POST | `/events` | Organizer | Create draft event and ticket types |
| PATCH | `/events/{eventId}` | Owning organizer | Edit event; published events with confirmed bookings remain published |
| GET | `/events/{eventId}/attendees` | Owning organizer | View confirmed attendee list |
| POST | `/events/{eventId}/cancel` | Owning organizer | Cancel event and notify booked attendees |
| POST | `/bookings` | Attendee/organizer | Atomically reserve ticket quantity for 10 minutes |
| POST | `/bookings/{bookingId}/mock-payment` | Booking owner | Simulate a successful payment without accepting or storing payment details |
| GET | `/bookings` | Attendee | List only the signed-in user's bookings |
| POST | `/bookings/{bookingId}/cancel` | Booking owner | Cancel eligible booking and release inventory |
| POST | `/bookings/expire` | Scheduled job with bearer secret | Expire pending checkout holds and release inventory |
| GET | `/tickets` | Attendee | List own tickets by upcoming/past status |
| POST | `/check-in` | Organizer | Validate and atomically check in a ticket for organizer's event |
| GET | `/admin/events/pending` | Admin | List events awaiting review |
| POST | `/admin/events/{eventId}/decision` | Admin | Approve or reject event |
| GET/POST | `/admin/organizer-requests` | Admin | List requests and approve/reject an attendee for organizer access |
| GET/PATCH | `/admin/users` | Admin | Search accounts, change roles, or suspend/reactivate users |

Auth-code emails require `RESEND_API_KEY` and `AUTH_EMAIL_FROM`; local development without a provider exposes a development-only code. Banner uploads, event ticket-type editing, and broader automated integration tests remain outstanding.

Booking creation should return `{ bookingId, holdExpiresAt, quantity, totalCents, currency, status }`. Confirmation returns the booking and one ticket public ID per seat. QR codes must encode only an opaque ID. Repeated payment confirmation and check-in requests must be idempotent. Never include mock card or UPI values in request logs, analytics, or database models.
