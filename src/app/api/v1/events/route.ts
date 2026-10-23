import { EventStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const eventSchema = z.object({ title: z.string().trim().min(5).max(120), description: z.string().trim().min(20).max(10000), category: z.string().trim().min(2).max(60), city: z.string().trim().min(2).max(100), venue: z.string().trim().max(180).optional(), onlineUrl: z.url().optional(), bannerUrl: z.url().optional(), startsAt: z.iso.datetime(), endsAt: z.iso.datetime(), status: z.enum(["DRAFT", "PENDING_APPROVAL"]).default("DRAFT"), ticketTypes: z.array(z.object({ name: z.string().trim().min(2).max(80), priceCents: z.number().int().min(0), capacity: z.number().int().min(1).max(100000), salesOpenAt: z.iso.datetime().optional(), salesCloseAt: z.iso.datetime().optional() })).min(1).max(10) });

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const q = params.get("q")?.trim();
    const category = params.get("category");
    const city = params.get("city");
    const from = params.get("from");
    const to = params.get("to");
    const minPrice = params.has("minPrice") ? Number(params.get("minPrice")) : undefined;
    const maxPrice = params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined;
    const events = await db.event.findMany({
      where: { status: EventStatus.PUBLISHED, startsAt: { gte: from && Number.isFinite(Date.parse(from)) ? new Date(from) : new Date(), ...(to && Number.isFinite(Date.parse(to)) ? { lte: new Date(to) } : {}) }, ...(category ? { category } : {}), ...(city ? { city } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { venue: { contains: q, mode: "insensitive" } }] } : {}), ...(minPrice !== undefined || maxPrice !== undefined ? { ticketTypes: { some: { priceCents: { ...(minPrice !== undefined && Number.isFinite(minPrice) ? { gte: Math.round(minPrice * 100) } : {}), ...(maxPrice !== undefined && Number.isFinite(maxPrice) ? { lte: Math.round(maxPrice * 100) } : {}) } } } } : {}) },
      include: { ticketTypes: { select: { id: true, name: true, priceCents: true, capacity: true, sold: true, reserved: true } } },
      orderBy: { startsAt: params.get("sort") === "date-desc" ? "desc" : "asc" },
    });
    const sorted = params.get("sort") === "price" ? events.toSorted((a, b) => Math.min(...a.ticketTypes.map((ticket) => ticket.priceCents)) - Math.min(...b.ticketTypes.map((ticket) => ticket.priceCents))) : events;
    return Response.json({ data: sorted });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser([UserRole.ORGANIZER]);
    const input = eventSchema.parse(await request.json());
    if (new Date(input.endsAt) <= new Date(input.startsAt)) throw new Error("Event end time must be after its start time.");
    const event = await db.event.create({ data: { ...input, organizerId: user.id, status: input.status === "PENDING_APPROVAL" ? EventStatus.PENDING_APPROVAL : EventStatus.DRAFT, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), ticketTypes: { create: input.ticketTypes.map((ticket) => ({ ...ticket, salesOpenAt: ticket.salesOpenAt ? new Date(ticket.salesOpenAt) : null, salesCloseAt: ticket.salesCloseAt ? new Date(ticket.salesCloseAt) : null })) } }, include: { ticketTypes: true } });
    return Response.json({ data: event }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
