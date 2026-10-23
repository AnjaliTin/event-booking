import { TicketStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const checkInSchema = z.object({ ticketId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const organizer = await requireUser([UserRole.ORGANIZER]);
    const { ticketId } = checkInSchema.parse(await request.json());
    const ticket = await db.ticket.findUnique({ where: { publicId: ticketId }, include: { booking: { include: { event: true } } } });
    if (!ticket || ticket.booking.event.organizerId !== organizer.id) throw new Error("Not found");
    const updated = await db.ticket.updateMany({ where: { id: ticket.id, status: TicketStatus.VALID, booking: { status: "CONFIRMED" } }, data: { status: TicketStatus.CHECKED_IN, checkedInAt: new Date() } });
    if (!updated.count) throw new Error("Ticket has already been used or cancelled.");
    return Response.json({ data: { checkedIn: true, ticketId: ticket.publicId, eventTitle: ticket.booking.event.title } });
  } catch (error) {
    return errorResponse(error);
  }
}