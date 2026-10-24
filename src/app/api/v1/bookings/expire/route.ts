import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

async function expireBookings(request: Request) {
  try {
    const expectedToken = process.env.CRON_SECRET;
    if (!expectedToken || request.headers.get("authorization") !== ["Bearer", expectedToken].join(" ")) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    const result = await db.$transaction(async (tx) => {
      const [expired] = await tx.$queryRaw<Array<{ expiredHolds: number }>>`
        WITH expired AS (
          UPDATE "Booking"
          SET "status" = 'EXPIRED'::"BookingStatus", "updatedAt" = NOW()
          WHERE "status" = 'PENDING'::"BookingStatus" AND "holdExpiresAt" <= NOW()
          RETURNING "ticketTypeId", "quantity"
        ),
        released AS (
          SELECT "ticketTypeId", SUM("quantity")::INTEGER AS "quantity"
          FROM expired
          GROUP BY "ticketTypeId"
        ),
        inventory AS (
          UPDATE "TicketType" AS ticket_type
          SET "reserved" = ticket_type."reserved" - released."quantity",
              "updatedAt" = NOW()
          FROM released
          WHERE ticket_type."id" = released."ticketTypeId"
          RETURNING ticket_type."id"
        )
        SELECT COUNT(*)::INTEGER AS "expiredHolds" FROM expired
      `;
      return { expiredHolds: expired.expiredHolds };
    }, { isolationLevel: "Serializable", timeout: 15_000 });

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  return expireBookings(request);
}

export async function POST(request: Request) {
  return expireBookings(request);
}
