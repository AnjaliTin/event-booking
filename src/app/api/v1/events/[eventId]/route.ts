import { EventStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const updateSchema = z.object({ title: z.string().trim().min(5).max(120), description: z.string().trim().min(20).max(10000), category: z.string().trim().min(2).max(60), city: z.string().trim().min(2).max(100), venue: z.string().trim().max(180).optional(), onlineUrl: z.url().optional().or(z.literal("")), bannerUrl: z.url().optional().or(z.literal("")), startsAt: z.iso.datetime(), endsAt: z.iso.datetime() });

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await context.params;
    const user = await getCurrentUser();
    const visibility = user?.role === UserRole.ADMIN
      ? { id: eventId }
      : user?.role === UserRole.ORGANIZER
        ? { id: eventId, OR: [{ status: EventStatus.PUBLISHED }, { organizerId: user.id }] }
        : { id: eventId, status: EventStatus.PUBLISHED };
    const event = await db.event.findFirst({ where: visibility, include: { ticketTypes: { select: { id: true, name: true, priceCents: true, capacity: true, sold: true, reserved: true } } } });
    if (!event) throw new Error("Not found");
    return Response.json({ data: event });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await requireUser([UserRole.ORGANIZER]);
    const { eventId } = await context.params;
    const input = updateSchema.parse(await request.json());
    const current = await db.event.findFirst({ where: { id: eventId, organizerId: user.id }, include: { bookings: { where: { status: "CONFIRMED" }, select: { id: true } } } });
    if (!current) throw new Error("Not found");
    if (new Date(input.endsAt) <= new Date(input.startsAt)) throw new Error("Event end time must be after its start time.");
    const event = await db.event.update({ where: { id: eventId }, data: { ...input, venue: input.venue || null, onlineUrl: input.onlineUrl || null, bannerUrl: input.bannerUrl || null, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), ...(current.status === EventStatus.PUBLISHED && current.bookings.length ? {} : { status: EventStatus.PENDING_APPROVAL }) } });
    return Response.json({ data: event });
  } catch (error) {
    return errorResponse(error);
  }
}