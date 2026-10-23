"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BannerUpload } from "@/components/banner-upload";

export default function NewEventPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const startsAt = new Date(String(formData.get("startsAt"))).toISOString();
    const endsAt = new Date(String(formData.get("endsAt"))).toISOString();
    const payload = {
      title: formData.get("title"), description: formData.get("description"), category: formData.get("category"), city: formData.get("city"), venue: formData.get("venue"), bannerUrl: bannerUrl || undefined, startsAt, endsAt, status: "PENDING_APPROVAL",
      ticketTypes: [{ name: formData.get("ticketName"), priceCents: Math.round(Number(formData.get("price")) * 100), capacity: Number(formData.get("capacity")), salesOpenAt: new Date().toISOString(), salesCloseAt: startsAt }],
    };
    try {
      const response = await fetch("/api/v1/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error(result.error?.message ?? "Could not create the event.");
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the event.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-3xl"><Link href="/dashboard" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><section className="mt-10 border-t-2 border-[#22241f] pt-7"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Organizer studio</p><h1 className="mt-2 font-serif text-4xl">Create an event.</h1><p className="mt-2 text-sm text-[#686a62]">Your event will be reviewed by an admin before it appears in discovery.</p>
    <form action={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium sm:col-span-2">Event name<input name="title" required minLength={5} maxLength={120} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <label className="text-sm font-medium sm:col-span-2">Description<textarea name="description" required minLength={20} rows={5} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <label className="text-sm font-medium">Category<select name="category" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3">{["Music", "Art & culture", "Food & drink", "Outdoors", "Film", "Technology", "Community"].map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="text-sm font-medium">City<input name="city" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <label className="text-sm font-medium sm:col-span-2">Venue or location<input name="venue" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <BannerUpload value={bannerUrl} onChange={setBannerUrl} />
      <label className="text-sm font-medium">Starts at<input name="startsAt" type="datetime-local" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <label className="text-sm font-medium">Ends at<input name="endsAt" type="datetime-local" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <label className="text-sm font-medium">Ticket type<input name="ticketName" defaultValue="General admission" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <label className="text-sm font-medium">Price (INR)<input name="price" type="number" min="0" step="1" defaultValue="500" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      <label className="text-sm font-medium">Ticket quantity<input name="capacity" type="number" min="1" max="100000" defaultValue="100" required className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label>
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <button disabled={busy} className="bg-[#22241f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e65e3f] disabled:opacity-60 sm:col-span-2">{busy ? "Submitting…" : "Submit for approval"}</button>
    </form>
  </section></div></main>;
}