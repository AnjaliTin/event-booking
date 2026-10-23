import QRCode from "qrcode";
import { BookingStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await db.ticket.findMany({ where: { booking: { userId: user.id, status: BookingStatus.CONFIRMED } }, include: { booking: { include: { event: true, ticketType: true } } }, orderBy: { booking: { event: { startsAt: "asc" } } } });
    const withQr = await Promise.all(tickets.map(async (ticket) => ({ ...ticket, qrDataUrl: await QRCode.toDataURL(ticket.publicId) })));
    return Response.json({ data: withQr });
  } catch (error) {
    return errorResponse(error);
  }
}