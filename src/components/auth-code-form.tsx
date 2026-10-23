"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthCodeFormProps = { mode: "verify" | "reset" };

export function AuthCodeForm({ mode }: AuthCodeFormProps) {
  const router = useRouter();
  const [stage, setStage] = useState(mode === "reset" ? "request" : "verify");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/auth/${mode === "reset" ? "forgot-password" : "resend-verification"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not send a code.");
      setDevelopmentCode(result.data?.developmentCode ?? "");
      setMessage(result.data?.message ?? "If the account exists, a code has been sent.");
      setStage(mode === "reset" ? "reset" : "verify");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send a code.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const endpoint = mode === "verify" ? "verify-email" : "reset-password";
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/v1/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, ...(mode === "reset" ? { password: form.get("password") } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "That code could not be used.");
      if (mode === "verify") router.push("/dashboard");
      else { setMessage("Password reset. Sign in with your new password."); setStage("done"); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That code could not be used.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "done") return <div className="mt-8 space-y-4"><p className="text-sm text-[#686a62]">{message}</p><a href="/login" className="block bg-[#22241f] px-4 py-3 text-center text-sm font-semibold text-white">Back to sign in</a></div>;

  if (stage === "request") return <form onSubmit={requestCode} className="mt-8 space-y-5"><label className="block text-sm font-medium">Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full bg-[#22241f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Send reset code"}</button></form>;

  return <form onSubmit={submitCode} className="mt-8 space-y-5">
    {mode === "verify" && <><label className="block text-sm font-medium">Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><button type="button" disabled={busy || !email} onClick={() => void requestCode()} className="text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Resend verification code</button></>}
    {message && <p className="text-sm text-[#686a62]">{message}</p>}
    {developmentCode && <p className="border border-[#dedbd3] bg-white px-3 py-2 text-xs">Development code: <strong className="font-mono">{developmentCode}</strong></p>}
    <label className="block text-sm font-medium">Six-digit code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3 font-mono tracking-[.25em]" /></label>
    {mode === "reset" && <label className="block text-sm font-medium">New password<input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /><span className="mt-1 block text-xs text-[#777970]">Use at least 10 characters.</span></label>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy || !email || code.length !== 6} className="w-full bg-[#22241f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Checking…" : mode === "verify" ? "Verify email" : "Reset password"}</button>
  </form>;
}