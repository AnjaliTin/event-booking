"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Ticket = { id: string; publicId: string; status: "VALID" | "CHECKED_IN" | "CANCELLED"; qrDataUrl: string; booking: { event: { title: string; city: string; venue: string | null; startsAt: string }; ticketType: { name: string }; reference: string } };

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/v1/tickets").then(async (response) => {
      const result = await response.json();
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error(result.error?.message ?? "Could not load tickets.");
      setTickets(result.data);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load tickets.")).finally(() => setLoading(false));
  }, [router]);

  const visible = tickets.filter((ticket) => (new Date(ticket.booking.event.startsAt) >= new Date()) === (filter === "upcoming"));
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between border-b border-[#dedbd3] pb-5"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><Link href="/dashboard" className="text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Dashboard</Link></header><section className="mt-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Your entry passes</p><h1 className="mt-2 font-serif text-4xl">My tickets.</h1><div className="mt-7 flex gap-6 border-b border-[#dedbd3]">{(["upcoming", "past"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`pb-3 text-sm font-semibold capitalize ${filter === item ? "border-b-2 border-[#e65e3f]" : "text-[#777970]"}`}>{item}</button>)}</div>
      {loading && <p className="py-10 text-sm text-[#686a62]">Loading your tickets…</p>}{error && <p role="alert" className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}{!loading && !error && visible.length === 0 && <p className="py-10 text-sm text-[#686a62]">No {filter} tickets yet.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{visible.map((ticket) => <article key={ticket.id} className="grid grid-cols-[1fr_auto] gap-4 border border-[#dedbd3] bg-white p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#e65e3f]">{new Date(ticket.booking.event.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p><h2 className="mt-2 font-serif text-2xl">{ticket.booking.event.title}</h2><p className="mt-1 text-sm text-[#686a62]">{ticket.booking.event.venue ?? ticket.booking.event.city}</p><p className="mt-3 text-xs">{ticket.booking.ticketType.name} · {ticket.status.replace("_", " ")}</p><p className="mt-1 break-all font-mono text-[10px] text-[#777970]">{ticket.publicId}</p></div><Image src={ticket.qrDataUrl} alt={`Ticket QR ${ticket.publicId}`} width={112} height={112} unoptimized className="self-center" /></article>)}</div>
    </section></div></main>;
}