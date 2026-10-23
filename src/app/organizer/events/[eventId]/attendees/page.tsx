"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Attendee = { attendee: { name: string; email: string }; ticketType: string; quantity: number; reference: string; tickets: { publicId: string; status: string; checkedInAt: string | null }[] };

export default function AttendeesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [eventId, setEventId] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { void params.then(({ eventId: id }) => setEventId(id)); }, [params]);
  useEffect(() => {
    if (!eventId) return;
    void fetch(`/api/v1/events/${eventId}/attendees`).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Could not load attendee list."); setAttendees(result.data); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load attendee list.")).finally(() => setLoading(false));
  }, [eventId]);
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-4xl"><header className="flex items-center justify-between border-b border-[#dedbd3] pb-5"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><Link href="/dashboard" className="text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Dashboard</Link></header><section className="mt-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Organizer report</p><h1 className="mt-2 font-serif text-4xl">Attendees.</h1>{loading && <p className="py-8 text-sm">Loading attendees…</p>}{error && <p role="alert" className="py-8 text-sm text-red-700">{error}</p>}{!loading && !error && attendees.length === 0 && <p className="py-8 text-sm text-[#686a62]">No confirmed attendees yet.</p>}<div className="mt-6 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">{attendees.map((entry) => <article key={entry.reference} className="py-4"><div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">{entry.attendee.name}</h2><p className="text-sm text-[#686a62]">{entry.attendee.email} · {entry.quantity} × {entry.ticketType}</p></div><span className="text-xs text-[#686a62]">{entry.reference}</span></div><p className="mt-2 text-xs text-[#777970]">{entry.tickets.map((ticket) => `${ticket.publicId}: ${ticket.status.toLowerCase()}`).join(" · ")}</p></article>)}</div></section></div></main>;
}