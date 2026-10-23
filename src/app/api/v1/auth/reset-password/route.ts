import bcrypt from "bcryptjs";
import { AuthCodePurpose } from "@prisma/client";
import { z } from "zod";
import { clearSession } from "@/lib/auth";
import { consumeAuthCode } from "@/lib/auth-codes";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const resetSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), code: z.string().regex(/^\d{6}$/), password: z.string().min(10).max(128) });

export async function POST(request: Request) {
  try {
    const input = resetSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (!user || !(await consumeAuthCode(user.id, AuthCodePurpose.PASSWORD_RESET, input.code))) return Response.json({ error: { code: "INVALID_OR_EXPIRED_CODE", message: "That code is invalid or expired. Request a new one and try again." } }, { status: 400 });
    const passwordHash = await bcrypt.hash(input.password, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    await db.authCode.updateMany({ where: { userId: user.id, purpose: AuthCodePurpose.PASSWORD_RESET, usedAt: null }, data: { usedAt: new Date() } });
    await clearSession();
    return Response.json({ data: { passwordReset: true } });
  } catch (error) {
    return errorResponse(error);
  }
}