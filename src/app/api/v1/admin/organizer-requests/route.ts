import { OrganizerRequestStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const decisionSchema = z.object({ userId: z.string().min(1), decision: z.enum(["approve", "reject"]) });

export async function GET() {
  try {
    await requireUser([UserRole.ADMIN]);
    const requests = await db.user.findMany({ where: { organizerRequest: OrganizerRequestStatus.PENDING }, select: { id: true, name: true, email: true, createdAt: true }, orderBy: { createdAt: "asc" } });
    return Response.json({ data: requests });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser([UserRole.ADMIN]);
    const input = decisionSchema.parse(await request.json());
    const status = input.decision === "approve" ? OrganizerRequestStatus.APPROVED : OrganizerRequestStatus.REJECTED;
    const user = await db.user.findFirst({ where: { id: input.userId, organizerRequest: OrganizerRequestStatus.PENDING } });
    if (!user) throw new Error("Not found");
    const profile = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: user.id }, data: { organizerRequest: status, ...(input.decision === "approve" ? { role: UserRole.ORGANIZER } : {}) }, select: { id: true, role: true, organizerRequest: true } });
      await tx.notification.create({ data: { userId: user.id, title: input.decision === "approve" ? "Organizer access approved" : "Organizer request declined", body: input.decision === "approve" ? "You can now create and manage events." : "Your organizer access request was declined." } });
      return updated;
    });
    return Response.json({ data: profile });
  } catch (error) {
    return errorResponse(error);
  }
}