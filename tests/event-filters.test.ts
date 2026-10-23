import assert from "node:assert/strict";
import test from "node:test";
import { filterEvents, type CatalogEvent } from "../src/lib/event-filters";

const sample: CatalogEvent[] = [
  { title: "Night Market", category: "Food", city: "Kochi", date: "Nov 1", sortDate: "2026-11-01", price: 300, venue: "Fort Kochi", image: "" },
  { title: "City Sounds", category: "Music", city: "Pune", date: "Nov 5", sortDate: "2026-11-05", price: 900, venue: "Garden Stage", image: "" },
  { title: "Open Studio", category: "Art", city: "Kochi", date: "Nov 8", sortDate: "2026-11-08", price: 0, venue: "Fort Kochi", image: "" },
];

const defaults = { query: "", category: "All events", city: "Any city", minPrice: 0, maxPrice: 3000, fromDate: "", toDate: "", sort: "date" as const };

test("search matches event names and venues without case sensitivity", () => {
  assert.deepEqual(filterEvents(sample, { ...defaults, query: "FORT" }).map((event) => event.title), ["Night Market", "Open Studio"]);
});

test("category, city, date, and price filters combine", () => {
  const filtered = filterEvents(sample, { ...defaults, category: "Food", city: "Kochi", fromDate: "2026-11-01", toDate: "2026-11-04", maxPrice: 500 });
  assert.deepEqual(filtered.map((event) => event.title), ["Night Market"]);
});

test("sorting supports price and reverse date order", () => {
  assert.deepEqual(filterEvents(sample, { ...defaults, sort: "price" }).map((event) => event.title), ["Open Studio", "Night Market", "City Sounds"]);
  assert.deepEqual(filterEvents(sample, { ...defaults, sort: "date-desc" }).map((event) => event.title), ["Open Studio", "City Sounds", "Night Market"]);
});

test("returns an empty list when nothing matches", () => {
  assert.deepEqual(filterEvents(sample, { ...defaults, query: "not found" }), []);
});