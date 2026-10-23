# Data model

The Prisma schema in `prisma/schema.prisma` is the proposed PostgreSQL model. This diagram documents the intended relationships; database migrations and generated Prisma client are not yet available because the package install was interrupted by low disk space.

```mermaid
erDiagram
  USER ||--o{ EVENT : organizes
  USER ||--o{ BOOKING : places
  USER ||--o{ NOTIFICATION : receives
  EVENT ||--|{ TICKET_TYPE : offers
  EVENT ||--o{ BOOKING : contains
  TICKET_TYPE ||--o{ BOOKING : reserves
  BOOKING ||--o{ TICKET : issues

  USER {
    string id PK
    string email UK
    string passwordHash
    enum role
    enum organizerRequest
  }
  EVENT {
    string id PK
    string organizerId FK
    string title
    string category
    string city
    datetime startsAt
    enum status
  }
  TICKET_TYPE {
    string id PK
    string eventId FK
    int priceCents
    int capacity
    int sold
    datetime salesOpenAt
    datetime salesCloseAt
  }
  BOOKING {
    string id PK
    string userId FK
    string eventId FK
    string ticketTypeId FK
    int quantity
    int totalCents
    enum status
    datetime holdExpiresAt
  }
  TICKET {
    string id PK
    string publicId UK
    string bookingId FK
    enum status
    datetime checkedInAt
  }
  NOTIFICATION {
    string id PK
    string userId FK
    string title
    datetime readAt
  }
```

Payment instrument details are intentionally absent from the schema. Counts and status transitions must be updated transactionally by the server.
