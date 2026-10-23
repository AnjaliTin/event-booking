import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const updateSchema = z.object({ userId: z.string().min(1), role: z.enum(["ATTENDEE", "ORGANIZER", "ADMIN"]).optional(), isActive: z.boolean().optional() }).refine((value) => value.role !== undefined || value.isActive !== undefined);

export async function GET(request: Request) {
  try {
    await requireUser([UserRole.ADMIN]);
    const query = new URL(request.url).searchParams.get("q")?.trim();
    const users = await db.user.findMany({ where: query ? { OR: [{ email: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }] } : undefined, select: { id: true, name: true, email: true, role: true, isActive: true, isEmailVerified: true, organizerRequest: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return Response.json({ data: users });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireUser([UserRole.ADMIN]);
    const input = updateSchema.parse(await request.json());
    if (input.userId === admin.id) throw new Error("You cannot modify your own admin account.");
    const user = await db.user.update({ where: { id: input.userId }, data: { ...(input.role ? { role: input.role } : {}), ...(input.isActive !== undefined ? { isActive: input.isActive } : {}), sessionVersion: { increment: 1 } }, select: { id: true, name: true, email: true, role: true, isActive: true, isEmailVerified: true } });
    return Response.json({ data: user });
  } catch (error) {
    return errorResponse(error);
  }
}