import { AuthCodePurpose } from "@prisma/client";
import { z } from "zod";
import { createAuthCode, sendAuthCode } from "@/lib/auth-codes";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const emailSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()) });

export async function POST(request: Request) {
  try {
    const { email } = emailSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, isEmailVerified: true } });
    if (!user || user.isEmailVerified) return Response.json({ data: { message: "If the account needs verification, a new code has been sent." } });
    const code = await createAuthCode(user.id, AuthCodePurpose.EMAIL_VERIFICATION);
    const delivery = await sendAuthCode(user.email, code, AuthCodePurpose.EMAIL_VERIFICATION);
    return Response.json({ data: { message: "A new code has been sent.", ...(delivery.delivered ? {} : { developmentCode: delivery.developmentCode }) } });
  } catch (error) {
    return errorResponse(error);
  }
}