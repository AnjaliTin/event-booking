import { BookingStatus, EventStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const holdSchema = z.object({ ticketTypeId: z.string().min(1), quantity: z.number().int().min(1).max(8) });

export async function GET() {
  try {
    const user = await requireUser();
    const bookings = await db.booking.findMany({ where: { userId: user.id }, include: { event: true, ticketType: true, tickets: true }, orderBy: { createdAt: "desc" } });
    return Response.json({ data: bookings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser([UserRole.ATTENDEE, UserRole.ORGANIZER]);
    const { ticketTypeId, quantity } = holdSchema.parse(await request.json());
    const booking = await db.$transaction(async (tx) => {
      const ticketType = await tx.ticketType.findUnique({ where: { id: ticketTypeId }, include: { event: true } });
      if (!ticketType || ticketType.event.status !== EventStatus.PUBLISHED) throw new Error("Ticket type not available.");
      const now = new Date();
      if ((ticketType.salesOpenAt && ticketType.salesOpenAt > now) || (ticketType.salesCloseAt && ticketType.salesCloseAt <= now) || ticketType.event.startsAt <= now) throw new Error("Ticket sales are closed.");

      await tx.$executeRaw`
        WITH expired AS (
          UPDATE "Booking"
          SET "status" = ${BookingStatus.EXPIRED}::"BookingStatus", "updatedAt" = NOW()
          WHERE "ticketTypeId" = ${ticketTypeId}
            AND "status" = ${BookingStatus.PENDING}::"BookingStatus"
            AND "holdExpiresAt" <= ${now}
          RETURNING "quantity"
        )
        UPDATE "TicketType"
        SET "reserved" = "reserved" - COALESCE((SELECT SUM("quantity") FROM expired), 0),
            "updatedAt" = NOW()
        WHERE "id" = ${ticketTypeId}
          AND EXISTS (SELECT 1 FROM expired)
      `;

      const reservedRows = await tx.$queryRaw<Array<{ id: string }>>`UPDATE "TicketType" SET "reserved" = "reserved" + ${quantity}, "updatedAt" = NOW() WHERE "id" = ${ticketTypeId} AND "sold" + "reserved" + ${quantity} <= "capacity" RETURNING "id"`;
      if (!reservedRows.length) throw new Error("Not enough tickets remain.");
      return tx.booking.create({ data: { userId: user.id, eventId: ticketType.eventId, ticketTypeId, quantity, totalCents: ticketType.priceCents * quantity, holdExpiresAt: new Date(now.getTime() + 10 * 60 * 1000) }, include: { event: true, ticketType: true } });
    }, { isolationLevel: "Serializable", timeout: 15_000 });

    return Response.json({ data: booking }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}