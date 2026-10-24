export type CatalogEvent = {
  title: string;
  category: string;
  city: string;
  date: string;
  sortDate: string;
  price: number;
  venue: string;
  image: string;
  id?: string;
};

export type CatalogFilters = {
  query: string;
  category: string;
  city: string;
  minPrice: number;
  maxPrice: number;
  fromDate: string;
  toDate: string;
  sort: "date" | "date-desc" | "price";
};

export function filterEvents<T extends CatalogEvent>(events: T[], filters: CatalogFilters): T[] {
  const query = filters.query.trim().toLowerCase();
  return events
    .filter((event) => filters.category === "All events" || event.category === filters.category)
    .filter((event) => filters.city === "Any city" || event.city === filters.city)
    .filter((event) => event.price >= filters.minPrice && event.price <= filters.maxPrice)
    .filter((event) => !filters.fromDate || event.sortDate >= filters.fromDate)
    .filter((event) => !filters.toDate || event.sortDate <= filters.toDate)
    .filter((event) => !query || `${event.title} ${event.city} ${event.venue}`.toLowerCase().includes(query))
    .sort((first, second) => filters.sort === "price"
      ? first.price - second.price
      : filters.sort === "date-desc"
        ? second.sortDate.localeCompare(first.sortDate)
        : first.sortDate.localeCompare(second.sortDate));
}