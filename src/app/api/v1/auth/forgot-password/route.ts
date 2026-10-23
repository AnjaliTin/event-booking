import { AuthCodePurpose } from "@prisma/client";
import { z } from "zod";
import { createAuthCode, sendAuthCode } from "@/lib/auth-codes";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const emailSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()) });
const genericResponse = { data: { message: "If an account exists for that email, a reset code has been sent." } };

export async function POST(request: Request) {
  try {
    const { email } = emailSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });
    if (!user) return Response.json(genericResponse);
    const code = await createAuthCode(user.id, AuthCodePurpose.PASSWORD_RESET);
    const delivery = await sendAuthCode(user.email, code, AuthCodePurpose.PASSWORD_RESET);
    return Response.json({ data: { ...genericResponse.data, ...(delivery.delivered ? {} : { developmentCode: delivery.developmentCode }) } });
  } catch (error) {
    if (error instanceof Error && error.message === "Email delivery is not configured.") return Response.json(genericResponse);
    return errorResponse(error);
  }
}