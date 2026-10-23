import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { AuthCodePurpose } from "@prisma/client";
import { db } from "@/lib/db";

const codeLifetimeMs = 10 * 60 * 1000;
const resendDelayMs = 60 * 1000;

function codeDigest(code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(code).digest("hex");
}

export async function createAuthCode(userId: string, purpose: AuthCodePurpose) {
  const latest = await db.authCode.findFirst({ where: { userId, purpose, createdAt: { gt: new Date(Date.now() - resendDelayMs) } }, orderBy: { createdAt: "desc" } });
  if (latest) throw new Error("Please wait one minute before requesting another code.");

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.authCode.create({ data: { userId, purpose, codeHash: codeDigest(code), expiresAt: new Date(Date.now() + codeLifetimeMs) } });
  return code;
}

export async function consumeAuthCode(userId: string, purpose: AuthCodePurpose, code: string) {
  const record = await db.authCode.findFirst({ where: { userId, purpose, usedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } }, orderBy: { createdAt: "desc" } });
  if (!record) return false;
  const expected = Buffer.from(record.codeHash, "hex");
  const actual = Buffer.from(codeDigest(code), "hex");
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!matches) {
    await db.authCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  const consumed = await db.authCode.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
  return consumed.count === 1;
}

export async function sendAuthCode(email: string, code: string, purpose: AuthCodePurpose) {
  const subject = purpose === AuthCodePurpose.EMAIL_VERIFICATION ? "Verify your Side Stage email" : "Reset your Side Stage password";
  const message = purpose === AuthCodePurpose.EMAIL_VERIFICATION
    ? `Your Side Stage verification code is ${code}. It expires in 10 minutes.`
    : `Your Side Stage password reset code is ${code}. It expires in 10 minutes.`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") return { delivered: false, developmentCode: code };
    throw new Error("Email delivery is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject, text: message }),
  });
  if (!response.ok) throw new Error("Could not send email. Please try again later.");
  return { delivered: true as const };
}