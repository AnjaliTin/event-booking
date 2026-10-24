"use client";

import Link from "next/link";
import { useMemo } from "react";
import { filterEvents } from "@/lib/event-filters";
import { updateUrlSearchParams, useUrlSearchParams } from "@/lib/use-url-search-params";

type DiscoverableEvent = {
  id: string;
  title: string;
  category: string;
  city: string;
  venue: string | null;
  startsAt: string;
  priceCents: number | null;
  bannerUrl: string | null;
};

const categories = ["All events", "Music", "Art & culture", "Food & drink", "Outdoors", "Film"];
const cities = ["Any city", "Bengaluru", "Chennai", "Kochi", "Mumbai", "Pune"];
const fallbackImages: Record<string, string> = {
  "The Monsoon Sessions": "photo-1506157786151-b8491531f063",
  "Objects of Tomorrow": "photo-1531058020387-3be344556be6",
  "Supper Club: Coastal": "photo-1414235077428-338989a2e8c0",
  "City on Two Wheels": "photo-1511994298241-608e28f14fde",
  "Small Worlds Film Night": "photo-1489599849927-2ee91cede3ba",
  "Good Things Grow Here": "photo-1497366754035-f200968a6e72",
  "After Hours / Live": "photo-1459749411175-04bf5292ceea",
  "The Sunday Table": "photo-1517248135467-4c7edcad34c4",
  "A Walk Through Old Kochi": "photo-1518005020951-eccb494ad742",
  "Soft Focus: Indie Shorts": "photo-1478720568477-152d9b164e26",
};

const currency = (cents: number) => `₹${(cents / 100).toLocaleString("en-IN")}`;

export function EventDiscovery({ events }: { events: DiscoverableEvent[] }) {
  const searchParams = useUrlSearchParams();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "All events";
  const city = searchParams.get("city") ?? "Any city";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "any";
  const sort = searchParams.get("sort") === "price" ? "price" : "date";

  const catalogEvents = useMemo(() => events.map((event) => ({
    ...event,
    venue: event.venue ?? "",
    date: new Date(event.startsAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).toUpperCase(),
    sortDate: event.startsAt.slice(0, 10),
    price: (event.priceCents ?? 0) / 100,
    image: fallbackImages[event.title] ?? "photo-1492684223066-81342ee5ff30",
  })), [events]);
  const visibleEvents = useMemo(() => filterEvents(catalogEvents, {
    query,
    category,
    city,
    minPrice: 0,
    maxPrice: maxPrice === "any" ? Number.POSITIVE_INFINITY : Number(maxPrice),
    fromDate,
    toDate,
    sort,
  }), [catalogEvents, category, city, fromDate, maxPrice, query, sort, toDate]);

  return <section className="mt-14">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Discover</p><h2 className="mt-2 font-serif text-3xl">All upcoming events</h2></div>
      <label className="flex w-full max-w-sm items-center border-b border-[#a9aaa3] py-2">
        <span className="mr-3 text-xl" aria-hidden="true">⌕</span>
        <span className="sr-only">Search events or places</span>
        <input value={query} onChange={(event) => updateUrlSearchParams({ q: event.target.value || null })} placeholder="Search events or places" className="w-full bg-transparent text-sm outline-none placeholder:text-[#8c8d86]" />
      </label>
    </div>
    <div className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Event categories">
      {categories.map((item) => <button key={item} type="button" onClick={() => updateUrlSearchParams({ category: item === "All events" ? null : item })} className={`shrink-0 border px-4 py-2 text-xs font-semibold ${category === item ? "border-[#22241f] bg-[#22241f] text-white" : "border-[#cfccc4] text-[#686a62] hover:border-[#22241f]"}`}>{item}</button>)}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[#dedbd3] pb-5 text-xs">
      <label className="flex items-center gap-2 text-[#686a62]">City<select value={city} onChange={(event) => updateUrlSearchParams({ city: event.target.value === "Any city" ? null : event.target.value })} className="bg-transparent font-semibold text-[#22241f]"><option>Any city</option>{cities.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="flex items-center gap-2 text-[#686a62]">From<input type="date" value={fromDate} onChange={(event) => updateUrlSearchParams({ from: event.target.value || null })} className="bg-transparent font-semibold text-[#22241f]" /></label>
      <label className="flex items-center gap-2 text-[#686a62]">To<input type="date" value={toDate} onChange={(event) => updateUrlSearchParams({ to: event.target.value || null })} className="bg-transparent font-semibold text-[#22241f]" /></label>
      <label className="flex items-center gap-2 text-[#686a62]">Max price<select value={maxPrice} onChange={(event) => updateUrlSearchParams({ maxPrice: event.target.value === "any" ? null : event.target.value })} className="bg-transparent font-semibold text-[#22241f]"><option value="any">Any price</option><option value="500">Under ₹500</option><option value="1000">Under ₹1,000</option><option value="1500">Under ₹1,500</option></select></label>
      <label className="ml-auto flex items-center gap-2 text-[#686a62]">Sort by<select value={sort} onChange={(event) => updateUrlSearchParams({ sort: event.target.value === "date" ? null : event.target.value })} className="bg-transparent font-semibold text-[#22241f]"><option value="date">Soonest</option><option value="price">Price: low to high</option></select></label>
    </div>
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visibleEvents.map((event) => {
        const imageUrl = event.bannerUrl ?? `https://images.unsplash.com/${event.image}?auto=format&fit=crop&w=900&q=80`;
        return <Link href={`/events/${event.id}`} key={event.id} className="group overflow-hidden border border-[#dedbd3] bg-white transition hover:-translate-y-1 hover:border-[#e65e3f] hover:shadow-lg">
          <div role="img" aria-label={`${event.title} event cover`} className="aspect-[1.5] bg-cover bg-center transition duration-500 group-hover:scale-[1.02]" style={{ backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(20,22,18,.65)), url(${JSON.stringify(imageUrl)})` }} />
          <div className="p-4">
            <p className="text-xs font-bold uppercase tracking-[.1em] text-[#e65e3f]">{event.category} · {event.date}</p>
            <h3 className="mt-2 font-serif text-2xl">{event.title}</h3>
            <p className="mt-1 text-sm text-[#686a62]">{event.city}{event.venue ? ` · ${event.venue}` : ""}</p>
            <p className="mt-3 text-sm font-semibold">{event.priceCents === null ? "Tickets unavailable" : event.priceCents === 0 ? "Free" : `From ${currency(event.priceCents)}`}</p>
          </div>
        </Link>;
      })}
      {visibleEvents.length === 0 && <p className="col-span-full py-10 text-center text-sm text-[#686a62]">No events match those filters. Try broadening your search.</p>}
    </div>
    <p className="mt-6 text-xs text-[#777970]">Showing {visibleEvents.length} of {events.length} events</p>
  </section>;
}
