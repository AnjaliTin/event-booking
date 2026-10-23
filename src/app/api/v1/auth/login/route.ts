import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const loginSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return Response.json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } }, { status: 401 });
    if (!user.isActive) return Response.json({ error: { code: "ACCOUNT_DISABLED", message: "This account is currently disabled." } }, { status: 403 });
    if (!user.isEmailVerified) return Response.json({ error: { code: "EMAIL_NOT_VERIFIED", message: "Verify your email before signing in." } }, { status: 403 });
    await createSession(user.id);
    return Response.json({ data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (error) {
    return errorResponse(error);
  }
}