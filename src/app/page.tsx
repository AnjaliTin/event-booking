"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { filterEvents } from "@/lib/event-filters";
import { updateUrlSearchParams, useUrlSearchParams } from "@/lib/use-url-search-params";

const events = [
  { title: "The Monsoon Sessions", category: "Music", city: "Bengaluru", date: "31 OCT · 6:30 PM", sortDate: "2026-10-31", price: 899, venue: "Courtyard by the Lake", image: "photo-1506157786151-b8491531f063" },
  { title: "Objects of Tomorrow", category: "Art & culture", city: "Mumbai", date: "02 NOV · 11:00 AM", sortDate: "2026-11-02", price: 350, venue: "The Design District", image: "photo-1531058020387-3be344556be6" },
  { title: "Supper Club: Coastal", category: "Food & drink", city: "Chennai", date: "06 NOV · 8:00 PM", sortDate: "2026-11-06", price: 1200, venue: "Salt House, Besant Nagar", image: "photo-1414235077428-338989a2e8c0" },
  { title: "City on Two Wheels", category: "Outdoors", city: "Pune", date: "08 NOV · 7:00 AM", sortDate: "2026-11-08", price: 250, venue: "Shaniwar Wada Gate", image: "photo-1511994298241-608e28f14fde" },
  { title: "Small Worlds Film Night", category: "Film", city: "Bengaluru", date: "12 NOV · 7:30 PM", sortDate: "2026-11-12", price: 500, venue: "Ranga Shankara", image: "photo-1489599849927-2ee91cede3ba" },
  { title: "Good Things Grow Here", category: "Art & culture", city: "Kochi", date: "14 NOV · 10:00 AM", sortDate: "2026-11-14", price: 0, venue: "Pepper House, Fort Kochi", image: "photo-1497366754035-f200968a6e72" },
  { title: "After Hours / Live", category: "Music", city: "Mumbai", date: "18 NOV · 8:00 PM", sortDate: "2026-11-18", price: 1500, venue: "antiSOCIAL, Lower Parel", image: "photo-1459749411175-04bf5292ceea" },
  { title: "The Sunday Table", category: "Food & drink", city: "Pune", date: "21 NOV · 12:30 PM", sortDate: "2026-11-21", price: 950, venue: "Moshi Moshi Studio", image: "photo-1517248135467-4c7edcad34c4" },
  { title: "A Walk Through Old Kochi", category: "Outdoors", city: "Kochi", date: "22 NOV · 8:00 AM", sortDate: "2026-11-22", price: 300, venue: "Parade Ground", image: "photo-1518005020951-eccb494ad742" },
  { title: "Soft Focus: Indie Shorts", category: "Film", city: "Chennai", date: "28 NOV · 6:00 PM", sortDate: "2026-11-28", price: 400, venue: "Theatre Marina", image: "photo-1478720568477-152d9b164e26" },
];

const categories = ["All events", "Music", "Art & culture", "Food & drink", "Outdoors", "Film"];
const cities = ["Any city", "Bengaluru", "Chennai", "Kochi", "Mumbai", "Pune"];
type ListedEvent = (typeof events)[number] & { id?: string };

export default function Home() {
  const searchParams = useUrlSearchParams();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "All events";
  const city = searchParams.get("city") ?? "Any city";
  const savedMaxPrice = searchParams.get("maxPrice");
  const maxPrice = !savedMaxPrice || savedMaxPrice === "3000" ? "any" : savedMaxPrice;
  const sort = searchParams.get("sort") === "price" ? "price" : "date";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";
  const [listedEvents, setListedEvents] = useState<ListedEvent[]>(events);
  const [previewNotice, setPreviewNotice] = useState("");
  const [authStatus, setAuthStatus] = useState<"checking" | "signed-in" | "signed-out" | "unavailable">("checking");
  useEffect(() => {
    let active = true;
    void fetch("/api/v1/profile", { cache: "no-store" }).then((response) => {
      if (!active) return;
      setAuthStatus(response.ok ? "signed-in" : response.status === 401 ? "signed-out" : "unavailable");
    }).catch(() => {
      if (active) setAuthStatus("unavailable");
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    void fetch("/api/v1/events").then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error("Live event list unavailable.");
      const liveEvents: ListedEvent[] = result.data.map((item: { id: string; title: string; category: string; city: string; venue: string | null; startsAt: string; ticketTypes: { priceCents: number }[] }) => {
        const preview = events.find((sample) => sample.title === item.title);
        return { id: item.id, title: item.title, category: item.category, city: item.city, date: new Date(item.startsAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }).toUpperCase(), sortDate: item.startsAt.slice(0, 10), price: Math.min(...item.ticketTypes.map((ticket) => ticket.priceCents / 100)), venue: item.venue ?? "Online event", image: preview?.image ?? "photo-1492684223066-81342ee5ff30" };
      });
      if (active) setListedEvents(liveEvents);
    }).catch(() => { if (active) setPreviewNotice("Showing preview listings. Connect the database to load live events."); });
    return () => { active = false; };
  }, []);
  const visibleEvents = useMemo(() => filterEvents(listedEvents, { query, category, city, minPrice: 0, maxPrice: maxPrice === "any" ? Number.POSITIVE_INFINITY : Number(maxPrice), fromDate, toDate, sort }), [category, city, fromDate, listedEvents, maxPrice, query, sort, toDate]);

  return <main className="min-h-screen bg-[#f6f4ef] text-[#22241f]">
    <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-10 lg:px-16">
      <a href="#top" className="font-serif text-[25px] font-bold">side<span className="text-[#e65e3f]">/</span>stage</a>
      <nav className="hidden items-center gap-8 text-sm md:flex"><a href="#events">Find an event</a><a href="#how">How it works</a><a href="#organizers">For organizers</a></nav>
      <div className="flex items-center gap-3"><Link href={authStatus === "signed-in" ? "/dashboard" : "/login"} className="hidden text-sm font-semibold sm:inline">{authStatus === "signed-in" ? "Your account" : authStatus === "signed-out" ? "Sign in" : "Account"}</Link><Link href="/dashboard" aria-label="Open dashboard" className="grid h-10 w-10 place-items-center border border-[#cfccc4] text-lg hover:border-[#22241f]">↗</Link><a href="#events" className="bg-[#22241f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e65e3f]">Explore</a></div>
    </header>
    <section id="top" className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-14 pt-8 sm:px-10 md:grid-cols-2 md:items-center md:pb-20 md:pt-12 lg:px-16">
      <div><p className="mb-5 text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">● Good things happen out there</p><h1 className="font-serif text-5xl leading-[.91] sm:text-7xl lg:text-8xl">Make room<br />for <em className="font-normal text-[#e65e3f]">a little</em><br />wonder.</h1><p className="mt-7 max-w-[420px] text-base leading-7 text-[#686a62]">A thoughtful guide to the gigs, gatherings and lovely little detours happening around your city.</p><a href="#events" className="mt-8 inline-flex gap-3 border-b border-[#22241f] pb-2 text-sm font-semibold">Find your next thing ↓</a></div>
      <div className="relative min-h-[360px] overflow-hidden bg-[#d3a445] sm:min-h-[440px]"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(180deg, transparent 35%, rgba(21,24,20,.72)), url('https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=85')" }} /><span className="absolute left-5 top-5 bg-[#f6f4ef] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em]">This week, in Bengaluru</span><div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-9 sm:bottom-9"><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/75">31 October · Live music</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">The Monsoon Sessions</h2><p className="mt-3 text-sm text-white/80">Courtyard by the Lake · from ₹899</p></div><span className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-[#e65e3f] text-xl text-white">↗</span></div>
    </section>
    <section id="events" className="border-y border-[#dedbd3] bg-[#eeece6]"><div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 md:py-16 lg:px-16">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">The good list</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">Find your kind of fun.</h2></div><label className="flex w-full max-w-sm items-center border-b border-[#a9aaa3] py-2"><span className="mr-3 text-xl" aria-hidden="true">⌕</span><span className="sr-only">Search events or places</span><input value={query} onChange={(event) => updateUrlSearchParams({ q: event.target.value || null })} placeholder="Search events or places" className="w-full bg-transparent text-sm outline-none placeholder:text-[#8c8d86]" /></label></div>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Event categories">{categories.map((item) => <button key={item} onClick={() => updateUrlSearchParams({ category: item === "All events" ? null : item })} className={`shrink-0 border px-4 py-2 text-xs font-semibold ${category === item ? "border-[#22241f] bg-[#22241f] text-white" : "border-[#cfccc4] text-[#686a62] hover:border-[#22241f]"}`}>{item}</button>)}</div>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[#dedbd3] pb-5 text-xs"><label className="flex items-center gap-2 text-[#686a62]">City<select value={city} onChange={(event) => updateUrlSearchParams({ city: event.target.value === "Any city" ? null : event.target.value })} className="bg-transparent font-semibold text-[#22241f]"><option>Any city</option>{cities.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="flex items-center gap-2 text-[#686a62]">From<input type="date" value={fromDate} onChange={(event) => updateUrlSearchParams({ from: event.target.value || null })} className="bg-transparent font-semibold text-[#22241f]" /></label><label className="flex items-center gap-2 text-[#686a62]">To<input type="date" value={toDate} onChange={(event) => updateUrlSearchParams({ to: event.target.value || null })} className="bg-transparent font-semibold text-[#22241f]" /></label><label className="flex items-center gap-2 text-[#686a62]">Max price<select value={maxPrice} onChange={(event) => updateUrlSearchParams({ maxPrice: event.target.value === "any" ? null : event.target.value })} className="bg-transparent font-semibold text-[#22241f]"><option value="any">Any price</option><option value="500">Under ₹500</option><option value="1000">Under ₹1,000</option><option value="1500">Under ₹1,500</option></select></label><label className="ml-auto flex items-center gap-2 text-[#686a62]">Sort by<select value={sort} onChange={(event) => updateUrlSearchParams({ sort: event.target.value === "date" ? null : event.target.value })} className="bg-transparent font-semibold text-[#22241f]"><option value="date">Soonest</option><option value="price">Price: low to high</option></select></label></div>
      {previewNotice && <p className="mt-4 text-xs text-[#777970]">{previewNotice}</p>}
      <div className="mt-7 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleEvents.map((event, index) => { const eventId = event.id ?? `seed-event-${events.findIndex((candidate) => candidate.title === event.title) + 1}`; return <Link href={`/events/${eventId}`} key={event.id ?? event.title} className="group min-w-0"><div className="relative aspect-[1.27] overflow-hidden bg-[#8da07a]"><div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(180deg, transparent 45%, rgba(20,22,18,.25)), url('https://images.unsplash.com/${event.image}?auto=format&fit=crop&w=900&q=80')` }} /><span className="absolute left-3 top-3 bg-[#f6f4ef] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em]">{event.category}</span>{index === 0 && <span className="absolute bottom-3 left-3 bg-[#e65e3f] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white">Staff pick</span>}</div><div className="flex items-start justify-between gap-3 pt-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#e65e3f]">{event.date}</p><h3 className="mt-1 font-serif text-[22px] leading-tight">{event.title}</h3><p className="mt-1 truncate text-xs text-[#777970]">{event.venue} · {event.city}</p></div><span className="shrink-0 pt-[17px] text-xs font-bold">{event.price === 0 ? "Free" : `₹${event.price.toLocaleString("en-IN")}`}</span></div></Link>; })}</div>
      {visibleEvents.length === 0 && <div className="py-20 text-center"><p className="font-serif text-3xl">Nothing on that list (yet).</p><p className="mt-2 text-sm text-[#686a62]">Try another city, category or price.</p></div>}<p className="mt-10 text-xs text-[#777970]">Showing {visibleEvents.length} of {listedEvents.length} events</p>
    </div></section>
    <section id="how" className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-10 md:grid-cols-2 md:items-center md:py-24 lg:px-16"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">Less scrolling, more living</p><h2 className="mt-3 max-w-lg font-serif text-4xl sm:text-5xl">Your plans should feel like you.</h2></div><div className="grid gap-5 sm:grid-cols-3">{[{ number: "01", title: "Find a feeling", copy: "Browse events picked for real people, not algorithms." }, { number: "02", title: "Save your spot", copy: "Choose your ticket and check out in a few easy steps." }, { number: "03", title: "Show up", copy: "Your ticket lives right here, ready when you are." }].map((step) => <div key={step.number} className="border-t border-[#c9c6bd] pt-4"><p className="text-xs font-bold text-[#e65e3f]">{step.number}</p><h3 className="mt-3 font-serif text-xl">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#686a62]">{step.copy}</p></div>)}</div></section>
    <section id="organizers" className="bg-[#22241f] text-[#f6f4ef]"><div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-12 sm:px-10 md:flex-row md:items-center md:justify-between md:py-16 lg:px-16"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e88369]">Made something worth gathering for?</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">Put it out into the world.</h2></div><a href="mailto:hello@sidestage.example" className="w-fit border border-white/40 px-5 py-3 text-sm font-semibold hover:bg-[#e65e3f]">Host an event ↗</a></div></section>
    <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-xs text-[#777970] sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16"><a href="#top" className="font-serif text-lg font-bold text-[#22241f]">side<span className="text-[#e65e3f]">/</span>stage</a><p>Good plans, made easy. © 2026 Side Stage</p><a href="#top">Back to top ↑</a></footer>
  </main>;
}
