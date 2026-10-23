import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

const cookieName = "sidestage_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const account = await db.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } });
  if (!account) throw new Error("Unauthorized");
  const token = await new SignJWT({ sub: userId, ver: account.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(secretKey());
  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: sessionDurationSeconds });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.ver !== "number") return null;
    const user = await db.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, role: true, sessionVersion: true, isEmailVerified: true, isActive: true } });
    if (!user || user.sessionVersion !== payload.ver || !user.isEmailVerified || !user.isActive) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (roles && !roles.includes(user.role)) throw new Error("Forbidden");
  return user;
}