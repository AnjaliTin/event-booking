import bcrypt from "bcryptjs";
import { AuthCodePurpose } from "@prisma/client";
import { z } from "zod";
import { createAuthCode, sendAuthCode } from "@/lib/auth-codes";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const registrationSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(10).max(128) });

export async function POST(request: Request) {
  try {
    const input = registrationSchema.parse(await request.json());
    if (process.env.NODE_ENV === "production" && (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)) {
      return Response.json({ error: { code: "EMAIL_DELIVERY_NOT_CONFIGURED", message: "Email verification is temporarily unavailable. Please try again later." } }, { status: 503 });
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await db.user.create({ data: { name: input.name, email: input.email, passwordHash }, select: { id: true, name: true, email: true, role: true } });
    try {
      const code = await createAuthCode(user.id, AuthCodePurpose.EMAIL_VERIFICATION);
      const delivery = await sendAuthCode(user.email, code, AuthCodePurpose.EMAIL_VERIFICATION);
      return Response.json({ data: { requiresVerification: true, email: user.email, ...(delivery.delivered ? {} : { developmentCode: delivery.developmentCode }) } }, { status: 201 });
    } catch (error) {
      await db.user.delete({ where: { id: user.id } });
      throw error;
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return Response.json({ error: { code: "EMAIL_IN_USE", message: "An account with this email already exists." } }, { status: 409 });
    return errorResponse(error);
  }
}