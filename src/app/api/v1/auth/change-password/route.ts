import bcrypt from "bcryptjs";
import { z } from "zod";
import { clearSession, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const changeSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(10).max(128) });

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = changeSchema.parse(await request.json());
    const account = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
    if (!(await bcrypt.compare(input.currentPassword, account.passwordHash))) return Response.json({ error: { code: "INVALID_PASSWORD", message: "Current password is incorrect." } }, { status: 400 });
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    await clearSession();
    return Response.json({ data: { passwordChanged: true } });
  } catch (error) {
    return errorResponse(error);
  }
}