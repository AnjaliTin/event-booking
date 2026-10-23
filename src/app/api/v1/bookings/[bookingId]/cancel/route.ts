import { BookingStatus, TicketStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function POST(_request: Request, context: { params: Promise<{ bookingId: string }> }) {
  try {
    const user = await requireUser();
    const { bookingId } = await context.params;
    const cancelled = await db.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({ where: { id: bookingId, userId: user.id }, include: { event: true } });
      if (!booking) throw new Error("Not found");
      if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) throw new Error("Booking cannot be cancelled.");
      if (booking.status === BookingStatus.CONFIRMED && booking.event.startsAt <= new Date()) throw new Error("Past event bookings cannot be cancelled.");
      const status = booking.status;
      await tx.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CANCELLED } });
      if (status === BookingStatus.PENDING) await tx.ticketType.update({ where: { id: booking.ticketTypeId }, data: { reserved: { decrement: booking.quantity } } });
      else {
        await tx.ticketType.update({ where: { id: booking.ticketTypeId }, data: { sold: { decrement: booking.quantity } } });
        await tx.ticket.updateMany({ where: { bookingId: booking.id, status: TicketStatus.VALID }, data: { status: TicketStatus.CANCELLED } });
      }
      return tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { tickets: true } });
    }, { isolationLevel: "Serializable" });
    return Response.json({ data: cancelled });
  } catch (error) {
    return errorResponse(error);
  }
}