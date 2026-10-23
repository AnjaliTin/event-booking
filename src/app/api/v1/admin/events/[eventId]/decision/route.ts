import { EventStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const decisionSchema = z.object({ decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(500).optional() });

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    await requireUser([UserRole.ADMIN]);
    const input = decisionSchema.parse(await request.json());
    const { eventId } = await context.params;
    const event = await db.event.findFirst({ where: { id: eventId, status: EventStatus.PENDING_APPROVAL } });
    if (!event) throw new Error("Not found");
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.event.update({ where: { id: eventId }, data: { status: input.decision === "approve" ? EventStatus.PUBLISHED : EventStatus.REJECTED } });
      await tx.notification.create({ data: { userId: event.organizerId, title: input.decision === "approve" ? "Event approved" : "Event needs changes", body: input.decision === "approve" ? `${event.title} is now published.` : `${event.title} was not approved. ${input.reason ?? "Please review the event details."}` } });
      return updated;
    });
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}