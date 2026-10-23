"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Booking = { id: string; reference: string; status: string; quantity: number; totalCents: number; event: { title: string; city: string; startsAt: string }; ticketType: { name: string } };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const router = useRouter();
  async function loadBookings() {
    const response = await fetch("/api/v1/bookings");
    const result = await response.json();
    if (response.status === 401) { router.push("/login"); return; }
    if (!response.ok) throw new Error(result.error?.message ?? "Could not load bookings.");
    setBookings(result.data);
  }
  useEffect(() => {
    let active = true;
    void fetch("/api/v1/bookings").then(async (response) => {
      const result = await response.json();
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error(result.error?.message ?? "Could not load bookings.");
      if (active) setBookings(result.data);
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load bookings."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);
  async function cancelBooking(id: string) {
    if (!window.confirm("Cancel this booking? This action cannot be undone.")) return;
    setBusyId(id);
    try {
      const response = await fetch(`/api/v1/bookings/${id}/cancel`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not cancel booking.");
      await loadBookings();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel booking.");
    } finally {
      setBusyId("");
    }
  }

  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-4xl"><header className="flex items-center justify-between border-b border-[#dedbd3] pb-5"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><Link href="/dashboard" className="text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Dashboard</Link></header><section className="mt-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Your reservations</p><h1 className="mt-2 font-serif text-4xl">My bookings.</h1>{loading && <p className="py-10 text-sm text-[#686a62]">Loading bookings…</p>}{error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}{!loading && !error && bookings.length === 0 && <p className="py-10 text-sm text-[#686a62]">No bookings yet. Find an event to get started.</p>}<div className="mt-6 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">{bookings.map((booking) => <article key={booking.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-serif text-2xl">{booking.event.title}</h2><p className="mt-1 text-sm text-[#686a62]">{booking.event.city} · {new Date(booking.event.startsAt).toLocaleDateString("en-IN")} · {booking.quantity} × {booking.ticketType.name}</p><p className="mt-1 text-xs text-[#777970]">Ref {booking.reference} · {booking.status.toLowerCase()}</p></div><div className="flex items-center gap-4"><strong className="text-sm">₹{(booking.totalCents / 100).toLocaleString("en-IN")}</strong>{["PENDING", "CONFIRMED"].includes(booking.status) && <button disabled={busyId === booking.id} onClick={() => void cancelBooking(booking.id)} className="border border-[#c9c6bd] px-3 py-2 text-xs font-semibold hover:border-red-600 hover:text-red-700 disabled:opacity-50">{busyId === booking.id ? "Cancelling…" : "Cancel"}</button>}</div></article>)}</div></section></div></main>;
}