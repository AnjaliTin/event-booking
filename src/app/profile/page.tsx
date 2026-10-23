"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Profile = { id: string; name: string; email: string; role: "ATTENDEE" | "ORGANIZER" | "ADMIN"; avatarUrl: string | null; organizerRequest: "PENDING" | "APPROVED" | "REJECTED" | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/v1/profile").then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not load profile.");
      setProfile(result.data);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load profile."));
  }, []);

  async function updateProfile(formData: FormData) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formData.get("name"), avatarUrl: formData.get("avatarUrl") || undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not update profile.");
      setProfile(result.data);
      setMessage("Profile updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update profile.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(formData: FormData) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: formData.get("currentPassword"), newPassword: formData.get("newPassword") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not change password.");
      setMessage("Password changed. Sign in again to continue.");
      router.push("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  async function requestOrganizerAccess() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/profile", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not request organizer access.");
      setProfile((current) => current ? { ...current, organizerRequest: result.data.organizerRequest } : current);
      setMessage("Organizer access request submitted for review.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request organizer access.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-3xl"><header className="flex items-center justify-between border-b border-[#dedbd3] pb-5"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><Link href="/dashboard" className="text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Dashboard</Link></header><section className="mt-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Account settings</p><h1 className="mt-2 font-serif text-4xl">Your profile.</h1>
    {!profile && !error && <p className="mt-8 text-sm text-[#686a62]">Loading account…</p>}
    {error && <p role="alert" className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    {profile && <><div className="mt-8 border-t border-[#c9c6bd] pt-5"><p className="text-sm text-[#686a62]">{profile.email} · {profile.role.toLowerCase()}</p><form action={updateProfile} className="mt-6 grid gap-5"><label className="text-sm font-medium">Display name<input name="name" required minLength={2} maxLength={80} defaultValue={profile.name} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium">Avatar image URL <span className="font-normal text-[#777970]">(optional)</span><input name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><button disabled={busy} className="w-fit bg-[#22241f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e65e3f] disabled:opacity-60">Save profile</button></form></div>
      <div className="mt-10 border-t border-[#c9c6bd] pt-5"><h2 className="font-serif text-2xl">Change password</h2><form action={changePassword} className="mt-5 grid gap-5"><label className="text-sm font-medium">Current password<input name="currentPassword" type="password" required autoComplete="current-password" className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium">New password<input name="newPassword" type="password" required minLength={10} autoComplete="new-password" className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><button disabled={busy} className="w-fit border border-[#22241f] px-5 py-3 text-sm font-semibold hover:bg-[#22241f] hover:text-white disabled:opacity-60">Update password</button></form></div>
      {profile.role === "ATTENDEE" && <div className="mt-10 border-t border-[#c9c6bd] pt-5"><h2 className="font-serif text-2xl">Become an organizer</h2><p className="mt-2 text-sm text-[#686a62]">Organizer access needs admin approval. Current status: {profile.organizerRequest?.toLowerCase() ?? "not requested"}.</p>{!profile.organizerRequest && <button disabled={busy} onClick={() => void requestOrganizerAccess()} className="mt-4 border border-[#22241f] px-4 py-2.5 text-sm font-semibold hover:bg-[#22241f] hover:text-white disabled:opacity-60">Request organizer access</button>}</div>}</>}
    {message && <p role="status" className="mt-5 text-sm text-emerald-800">{message}</p>}
  </section></div></main>;
}