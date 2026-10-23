import { OrganizerRequestStatus } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const profileSchema = z.object({ name: z.string().trim().min(2).max(80), avatarUrl: z.url().optional().or(z.literal("")) });

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, name: true, email: true, role: true, avatarUrl: true, organizerRequest: true, createdAt: true } });
    return Response.json({ data: profile });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const input = profileSchema.parse(await request.json());
    const profile = await db.user.update({ where: { id: user.id }, data: { name: input.name, avatarUrl: input.avatarUrl || null }, select: { id: true, name: true, email: true, role: true, avatarUrl: true, organizerRequest: true } });
    return Response.json({ data: profile });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    if (user.role !== "ATTENDEE") throw new Error("Only attendees may request organizer access.");
    const profile = await db.user.update({ where: { id: user.id }, data: { organizerRequest: OrganizerRequestStatus.PENDING }, select: { id: true, organizerRequest: true } });
    return Response.json({ data: profile }, { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}