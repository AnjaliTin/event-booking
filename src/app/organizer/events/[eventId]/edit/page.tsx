"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BannerUpload } from "@/components/banner-upload";

type EventData = { title: string; description: string; category: string; city: string; venue: string | null; onlineUrl: string | null; bannerUrl: string | null; startsAt: string; endsAt: string };

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState<EventData | null>(null);
  const [error, setError] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { void params.then(({ eventId: id }) => setEventId(id)); }, [params]);
  useEffect(() => {
    if (!eventId) return;
    void fetch(`/api/v1/events/${eventId}`).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Could not load event."); setEvent(result.data); setBannerUrl(result.data.bannerUrl ?? ""); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load event."));
  }, [eventId]);

  async function save(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/events/${eventId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: formData.get("title"), description: formData.get("description"), category: formData.get("category"), city: formData.get("city"), venue: formData.get("venue"), bannerUrl: bannerUrl || undefined, startsAt: new Date(String(formData.get("startsAt"))).toISOString(), endsAt: new Date(String(formData.get("endsAt"))).toISOString() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not save event.");
      router.push("/dashboard");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save event."); }
    finally { setBusy(false); }
  }

  const toLocalDateTime = (value: string) => new Date(value).toISOString().slice(0, 16);
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-3xl"><Link href="/dashboard" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><section className="mt-10 border-t-2 border-[#22241f] pt-7"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Organizer studio</p><h1 className="mt-2 font-serif text-4xl">Edit event.</h1>{!event && !error && <p className="mt-6 text-sm">Loading event…</p>}{error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}{event && <form action={save} className="mt-8 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium sm:col-span-2">Event name<input name="title" required minLength={5} maxLength={120} defaultValue={event.title} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea name="description" required minLength={20} rows={5} defaultValue={event.description} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium">Category<input name="category" required defaultValue={event.category} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium">City<input name="city" required defaultValue={event.city} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium sm:col-span-2">Venue<input name="venue" defaultValue={event.venue ?? ""} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium sm:col-span-2">Banner image URL<BannerUpload value={bannerUrl} onChange={setBannerUrl} /></label><label className="text-sm font-medium">Starts at<input name="startsAt" type="datetime-local" required defaultValue={toLocalDateTime(event.startsAt)} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><label className="text-sm font-medium">Ends at<input name="endsAt" type="datetime-local" required defaultValue={toLocalDateTime(event.endsAt)} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3" /></label><button disabled={busy} className="bg-[#22241f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e65e3f] disabled:opacity-60 sm:col-span-2">{busy ? "Saving…" : "Save changes"}</button></form>}</section></div></main>;
}