import { AuthCodePurpose } from "@prisma/client";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { consumeAuthCode } from "@/lib/auth-codes";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const verifySchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const input = verifySchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || user.isEmailVerified || !(await consumeAuthCode(user.id, AuthCodePurpose.EMAIL_VERIFICATION, input.code))) return Response.json({ error: { code: "INVALID_OR_EXPIRED_CODE", message: "That code is invalid or expired. Request a new one and try again." } }, { status: 400 });
    const verified = await db.user.update({ where: { id: user.id }, data: { isEmailVerified: true }, select: { id: true, name: true, email: true, role: true } });
    await createSession(verified.id);
    return Response.json({ data: { user: verified } });
  } catch (error) {
    return errorResponse(error);
  }
}