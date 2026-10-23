import { BookingStatus, EventStatus, TicketStatus, UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function POST(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const organizer = await requireUser([UserRole.ORGANIZER]);
    const { eventId } = await context.params;
    const event = await db.event.findFirst({ where: { id: eventId, organizerId: organizer.id }, include: { bookings: { where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } } } } });
    if (!event) throw new Error("Not found");
    const result = await db.$transaction(async (tx) => {
      await tx.event.update({ where: { id: eventId }, data: { status: EventStatus.CANCELLED } });
      for (const booking of event.bookings) {
        const changed = await tx.booking.updateMany({ where: { id: booking.id, status: booking.status }, data: { status: BookingStatus.CANCELLED } });
        if (!changed.count) continue;
        if (booking.status === BookingStatus.PENDING) await tx.ticketType.update({ where: { id: booking.ticketTypeId }, data: { reserved: { decrement: booking.quantity } } });
        else {
          await tx.ticketType.update({ where: { id: booking.ticketTypeId }, data: { sold: { decrement: booking.quantity } } });
          await tx.ticket.updateMany({ where: { bookingId: booking.id, status: TicketStatus.VALID }, data: { status: TicketStatus.CANCELLED } });
        }
        await tx.notification.create({ data: { userId: booking.userId, title: "Event cancelled", body: `${event.title} has been cancelled by the organizer.` } });
      }
      return { cancelled: true, notified: event.bookings.length };
    }, { isolationLevel: "Serializable" });
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}