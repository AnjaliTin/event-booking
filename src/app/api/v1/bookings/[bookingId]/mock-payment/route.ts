import { BookingStatus } from "@prisma/client";
import QRCode from "qrcode";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const paymentSchema = z.object({ simulate: z.literal("success") });

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  try {
    const user = await requireUser();
    paymentSchema.parse(await request.json());
    const { bookingId } = await context.params;
    const result = await db.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({ where: { id: bookingId, userId: user.id }, include: { event: true, ticketType: true } });
      if (!booking) throw new Error("Not found");
      if (booking.status === BookingStatus.CONFIRMED) return tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { tickets: true, event: true, ticketType: true } });
      if (booking.status !== BookingStatus.PENDING || booking.holdExpiresAt <= new Date()) throw new Error("This ticket hold has expired.");

      const confirmed = await tx.booking.updateMany({ where: { id: booking.id, userId: user.id, status: BookingStatus.PENDING, holdExpiresAt: { gt: new Date() } }, data: { status: BookingStatus.CONFIRMED } });
      if (!confirmed.count) throw new Error("Booking is no longer available.");
      const inventory = await tx.ticketType.updateMany({ where: { id: booking.ticketTypeId, reserved: { gte: booking.quantity } }, data: { reserved: { decrement: booking.quantity }, sold: { increment: booking.quantity } } });
      if (!inventory.count) throw new Error("Ticket inventory changed. Please contact support.");
      await tx.ticket.createMany({ data: Array.from({ length: booking.quantity }, () => ({ bookingId: booking.id })) });
      return tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { tickets: true, event: true, ticketType: true } });
    }, { isolationLevel: "Serializable" });
    const tickets = await Promise.all(result.tickets.map(async (ticket) => ({ ...ticket, qrDataUrl: await QRCode.toDataURL(ticket.publicId) })));
    return Response.json({ data: { ...result, tickets } });
  } catch (error) {
    return errorResponse(error);
  }
}