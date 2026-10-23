import { BookingStatus, UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const organizer = await requireUser([UserRole.ORGANIZER]);
    const { eventId } = await context.params;
    const event = await db.event.findFirst({ where: { id: eventId, organizerId: organizer.id }, select: { id: true } });
    if (!event) throw new Error("Not found");
    const bookings = await db.booking.findMany({ where: { eventId, status: BookingStatus.CONFIRMED }, include: { user: { select: { name: true, email: true } }, ticketType: { select: { name: true } }, tickets: { select: { publicId: true, status: true, checkedInAt: true } } }, orderBy: { createdAt: "asc" } });
    return Response.json({ data: bookings.map(({ user, ticketType, tickets, quantity, reference }) => ({ attendee: user, ticketType: ticketType.name, quantity, reference, tickets })) });
  } catch (error) {
    return errorResponse(error);
  }
}