import { EventStatus, UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    await requireUser([UserRole.ADMIN]);
    const events = await db.event.findMany({ where: { status: EventStatus.PENDING_APPROVAL }, include: { organizer: { select: { id: true, name: true, email: true } }, ticketTypes: true }, orderBy: { createdAt: "asc" } });
    return Response.json({ data: events });
  } catch (error) {
    return errorResponse(error);
  }
}