import { BookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const expectedToken = process.env.CRON_SECRET;
    if (!expectedToken || request.headers.get("authorization") !== `Bearer ${expectedToken}`) return Response.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      const expired = await tx.booking.findMany({ where: { status: BookingStatus.PENDING, holdExpiresAt: { lte: now } }, select: { id: true, ticketTypeId: true, quantity: true } });
      const byType = new Map<string, number>();
      let expiredHolds = 0;
      for (const booking of expired) {
        const updated = await tx.booking.updateMany({ where: { id: booking.id, status: BookingStatus.PENDING }, data: { status: BookingStatus.EXPIRED } });
        if (updated.count) {
          expiredHolds += 1;
          byType.set(booking.ticketTypeId, (byType.get(booking.ticketTypeId) ?? 0) + booking.quantity);
        }
      }
      for (const [ticketTypeId, quantity] of byType) await tx.ticketType.update({ where: { id: ticketTypeId }, data: { reserved: { decrement: quantity } } });
      return { expiredHolds };
    }, { isolationLevel: "Serializable" });
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}