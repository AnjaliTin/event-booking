"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TicketType = { id: string; name: string; priceCents: number; capacity: number; sold: number; reserved: number };
type EventRecord = { id: string; title: string; description: string; category: string; city: string; venue: string | null; startsAt: string; ticketTypes: TicketType[] };
type IssuedTicket = { publicId: string; qrDataUrl: string };

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [eventId, setEventId] = useState("");
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [bookingId, setBookingId] = useState("");
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const router = useRouter();

  useEffect(() => { void params.then(({ eventId: id }) => setEventId(id)); }, [params]);
  useEffect(() => {
    if (!eventId) return;
    void fetch(`/api/v1/events/${eventId}`).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Event could not be loaded.");
      setEvent(payload.data);
      setTicketTypeId(payload.data.ticketTypes[0]?.id ?? "");
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Event could not be loaded."));
  }, [eventId]);

  const selectedTicket = event?.ticketTypes.find((ticket) => ticket.id === ticketTypeId);
  const total = (selectedTicket?.priceCents ?? 0) * quantity;

  async function createHold() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketTypeId, quantity }) });
      const payload = await response.json();
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error(payload.error?.message ?? "Could not hold tickets.");
      setBookingId(payload.data.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not hold tickets.");
    } finally {
      setBusy(false);
    }
  }

  async function simulatePayment(formData: FormData) {
    setBusy(true);
    setMessage("");
    try {
      if (paymentMethod === "card" && !String(formData.get("cardNumber") ?? "").replace(/\s/g, "").match(/^\d{16}$/)) throw new Error("Enter a 16-digit demo card number.");
      if (paymentMethod === "upi" && !String(formData.get("upiId") ?? "").match(/^[\w.-]{2,}@[\w.-]{2,}$/)) throw new Error("Enter a demo UPI ID such as guest@demo.");
      await new Promise((resolve) => setTimeout(resolve, 700));
      // Payment form values stay in this component and are never sent to the server.
      const response = await fetch(`/api/v1/bookings/${bookingId}/mock-payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ simulate: "success" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Mock payment failed.");
      setTickets(payload.data.tickets);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mock payment failed.");
    } finally {
      setBusy(false);
    }
  }

  if (tickets.length) return <main className="min-h-screen bg-[#f6f4ef] px-5 py-10 text-[#22241f]"><section className="mx-auto max-w-3xl"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><div className="mt-12 border-t-2 border-[#22241f] pt-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">You’re on the list</p><h1 className="mt-2 font-serif text-4xl">Booking confirmed.</h1><p className="mt-2 text-sm text-[#686a62]">Your mock payment succeeded. No payment details were collected or stored.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{tickets.map((ticket, index) => <article key={ticket.publicId} className="border border-[#dedbd3] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[.12em]">Ticket {index + 1}</p><Image src={ticket.qrDataUrl} alt={`QR ticket ${ticket.publicId}`} width={160} height={160} unoptimized className="mx-auto mt-4" /><p className="mt-3 break-all text-center font-mono text-xs">{ticket.publicId}</p></article>)}</div><Link href="/dashboard" className="mt-8 inline-block bg-[#22241f] px-5 py-3 text-sm font-semibold text-white">View my bookings</Link></div></section></main>;
  if (!event) return <main className="min-h-screen bg-[#f6f4ef] px-5 py-12 text-[#22241f]"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><p className="mx-auto mt-24 max-w-2xl text-center text-sm text-[#686a62]">{message || "Loading event…"}</p></main>;

  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-5xl"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><div className="mt-10 grid gap-10 md:grid-cols-[1.1fr_.9fr]"><section><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">{event.category} · {event.city}</p><h1 className="mt-3 font-serif text-5xl leading-tight">{event.title}</h1><p className="mt-4 text-sm text-[#686a62]">{new Date(event.startsAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })} · {event.venue ?? "Online event"}</p><p className="mt-8 whitespace-pre-wrap text-base leading-7 text-[#51534d]">{event.description}</p></section><section className="h-fit border-t-2 border-[#22241f] bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl">Choose your ticket</h2>{!bookingId ? <><label className="mt-5 block text-sm font-medium">Ticket type<select value={ticketTypeId} onChange={(change) => setTicketTypeId(change.target.value)} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3">{event.ticketTypes.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.name} · {ticket.priceCents === 0 ? "Free" : `₹${(ticket.priceCents / 100).toLocaleString("en-IN")}`}</option>)}</select></label><label className="mt-4 block text-sm font-medium">Quantity<select value={quantity} onChange={(change) => setQuantity(Number(change.target.value))} className="mt-2 block w-full border border-[#d6d2c9] bg-white px-3 py-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((number) => <option key={number} value={number}>{number}</option>)}</select></label><div className="mt-5 flex justify-between border-t border-[#dedbd3] pt-4 text-sm"><span>Total</span><strong>₹{(total / 100).toLocaleString("en-IN")}</strong></div><button disabled={!ticketTypeId || busy} onClick={() => void createHold()} className="mt-5 w-full bg-[#22241f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e65e3f] disabled:opacity-50">{busy ? "Holding tickets…" : "Hold tickets for 10 minutes"}</button><p className="mt-3 text-xs leading-5 text-[#777970]">Inventory is held on the server. Do not enter real payment details.</p></> : <form action={simulatePayment} className="mt-5 space-y-5"><p className="text-sm leading-6 text-[#686a62]">Your inventory is held for 10 minutes. This demo does not process or store payment information.</p><div className="flex gap-2" role="group" aria-label="Mock payment method"><button type="button" onClick={() => setPaymentMethod("card")} className={`border px-3 py-2 text-xs font-semibold ${paymentMethod === "card" ? "border-[#22241f] bg-[#22241f] text-white" : "border-[#d6d2c9]"}`}>Card</button><button type="button" onClick={() => setPaymentMethod("upi")} className={`border px-3 py-2 text-xs font-semibold ${paymentMethod === "upi" ? "border-[#22241f] bg-[#22241f] text-white" : "border-[#d6d2c9]"}`}>UPI</button></div>{paymentMethod === "card" ? <><label className="block text-sm font-medium">Demo card number<input name="cardNumber" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" maxLength={19} required className="mt-2 block w-full border border-[#d6d2c9] px-3 py-3 font-mono" /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Expiry<input name="expiry" placeholder="MM/YY" autoComplete="off" required className="mt-2 block w-full border border-[#d6d2c9] px-3 py-3" /></label><label className="text-sm font-medium">CVV<input name="cvv" inputMode="numeric" autoComplete="off" maxLength={4} required className="mt-2 block w-full border border-[#d6d2c9] px-3 py-3" /></label></div></> : <label className="block text-sm font-medium">Demo UPI ID<input name="upiId" autoComplete="off" placeholder="guest@demo" required className="mt-2 block w-full border border-[#d6d2c9] px-3 py-3" /></label>}<button disabled={busy} className="w-full bg-[#e65e3f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Processing mock payment…" : `Pay ₹${(total / 100).toLocaleString("en-IN")} (mock)`}</button></form>}{message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}</section></div></div></main>;
}