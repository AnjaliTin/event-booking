"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const router = useRouter();
  const isRegister = mode === "register";

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/auth/${isRegister ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not sign in.");
      if (isRegister) {
        setPendingEmail(result.data.email);
        setDevelopmentCode(result.data.developmentCode ?? "");
        return;
      }
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmail() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail, code: verificationCode }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not verify email.");
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not verify email.");
    } finally {
      setBusy(false);
    }
  }

  if (pendingEmail) return <section className="mt-8 space-y-5">
    <p className="text-sm leading-6 text-[#686a62]">Enter the six-digit code sent to <strong>{pendingEmail}</strong>. The code expires in 10 minutes.</p>
    {developmentCode && <p className="border border-[#dedbd3] bg-white px-3 py-2 text-xs">Development verification code: <strong className="font-mono">{developmentCode}</strong></p>}
    <label className="block text-sm font-medium">Verification code<input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3 font-mono tracking-[.25em] outline-none focus:border-[#e65e3f]" /></label>
    {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    <button disabled={busy || verificationCode.length !== 6} onClick={() => void verifyEmail()} className="w-full bg-[#22241f] px-4 py-3 font-semibold text-white hover:bg-[#e65e3f] disabled:opacity-60">{busy ? "Verifying…" : "Verify email"}</button>
    <button disabled={busy} onClick={async () => { const response = await fetch("/api/v1/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail }) }); const result = await response.json(); setDevelopmentCode(result.data?.developmentCode ?? ""); setError(result.error?.message ?? result.data?.message ?? "Could not send a code."); }} className="w-full text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Send a new code</button>
  </section>;

  return <form action={submit} className="mt-8 space-y-5">
    {isRegister && <label className="block text-sm font-medium">Name<input name="name" required minLength={2} maxLength={80} autoComplete="name" className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3 outline-none focus:border-[#e65e3f]" /></label>}
    <label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3 outline-none focus:border-[#e65e3f]" /></label>
    <label className="block text-sm font-medium">Password<input name="password" type="password" required minLength={isRegister ? 10 : 1} autoComplete={isRegister ? "new-password" : "current-password"} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3 outline-none focus:border-[#e65e3f]" />{isRegister && <span className="mt-1 block text-xs text-[#777970]">Use at least 10 characters.</span>}</label>
    {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    <button disabled={busy} className="w-full bg-[#22241f] px-4 py-3 font-semibold text-white transition hover:bg-[#e65e3f] disabled:opacity-60">{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
    {!isRegister && <a href="/forgot-password" className="block text-center text-sm font-semibold text-[#686a62] underline decoration-[#e65e3f] underline-offset-4">Forgot password?</a>}
  </form>;
}