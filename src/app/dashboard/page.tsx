import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminConsole } from "@/components/admin-console";

export const instant = false;

const currency = (amount: number) => `₹${(amount / 100).toLocaleString("en-IN")}`;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === UserRole.ADMIN) {
    const [userCount, eventCount, bookingCount] = await Promise.all([
      db.user.count(),
      db.event.count(),
      db.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    ]);
    return <DashboardShell name={user.name} role="Platform admin">
      <div className="grid gap-4 sm:grid-cols-3">{[["People", userCount], ["Events", eventCount], ["Confirmed bookings", bookingCount]].map(([label, value]) => <Metric key={label} label={String(label)} value={String(value)} />)}</div>
      <section className="mt-12"><AdminConsole /></section>
    </DashboardShell>;
  }

  if (user.role === UserRole.ORGANIZER) {
    const organizerEvents = await db.event.findMany({ where: { organizerId: user.id }, include: { ticketTypes: true, bookings: { where: { status: BookingStatus.CONFIRMED }, select: { quantity: true, totalCents: true } } }, orderBy: { startsAt: "asc" } });
    const sales = organizerEvents.flatMap((event) => event.bookings).reduce((total, booking) => total + booking.totalCents, 0);
    const seats = organizerEvents.flatMap((event) => event.bookings).reduce((total, booking) => total + booking.quantity, 0);
    return <DashboardShell name={user.name} role="Event organizer">
      <div className="grid gap-4 sm:grid-cols-3"><Metric label="Gross sales" value={currency(sales)} /><Metric label="Tickets sold" value={String(seats)} /><Metric label="Your events" value={String(organizerEvents.length)} /></div>
      <section className="mt-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Your calendar</p><h2 className="mt-2 font-serif text-3xl">Events and sales</h2></div><div className="flex gap-2"><Link href="/organizer/check-in" className="border border-[#c9c6bd] px-4 py-2.5 text-sm font-semibold">Check in</Link><Link href="/organizer/events/new" className="bg-[#22241f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e65e3f]">Create event +</Link></div></div>
        <div className="mt-5 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">{organizerEvents.map((event) => <article key={event.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-serif text-xl">{event.title}</h3><p className="mt-1 text-xs text-[#686a62]">{event.city} · {new Date(event.startsAt).toLocaleDateString("en-IN")} · {event.status.replaceAll("_", " ")}</p></div><div className="flex flex-wrap items-center gap-4"><p className="text-sm font-semibold">{event.bookings.reduce((sum, booking) => sum + booking.quantity, 0)} tickets · {currency(event.bookings.reduce((sum, booking) => sum + booking.totalCents, 0))}</p><Link href={`/organizer/events/${event.id}/attendees`} className="text-xs font-semibold underline decoration-[#e65e3f] underline-offset-4">Attendees</Link><Link href={`/organizer/events/${event.id}/edit`} className="text-xs font-semibold underline decoration-[#e65e3f] underline-offset-4">Edit</Link></div></article>)}{organizerEvents.length === 0 && <p className="py-6 text-sm text-[#686a62]">Create your first event to start building a crowd.</p>}</div>
      </section>
    </DashboardShell>;
  }

  const bookings = await db.booking.findMany({ where: { userId: user.id }, include: { event: true, ticketType: true, tickets: true }, orderBy: { createdAt: "desc" } });
  const upcoming = bookings.filter((booking) => booking.status === BookingStatus.CONFIRMED && booking.event.startsAt >= new Date());
  const paid = bookings.filter((booking) => booking.status === BookingStatus.CONFIRMED).reduce((total, booking) => total + booking.totalCents, 0);
  return <DashboardShell name={user.name} role="Attendee">
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Upcoming events" value={String(upcoming.length)} /><Metric label="Tickets in your account" value={String(bookings.reduce((sum, booking) => sum + booking.tickets.length, 0))} /><Metric label="Confirmed spend" value={currency(paid)} /></div>
    <section className="mt-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Your plans</p><h2 className="mt-2 font-serif text-3xl">Bookings and tickets</h2></div><Link href="/#events" className="text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Find another event</Link></div>
      <div className="mt-5 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">{bookings.map((booking) => <article key={booking.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-serif text-xl">{booking.event.title}</h3><p className="mt-1 text-xs text-[#686a62]">{booking.event.city} · {new Date(booking.event.startsAt).toLocaleDateString("en-IN")} · {booking.quantity} × {booking.ticketType.name}</p></div><div className="flex items-center gap-4"><span className="text-sm font-semibold">{booking.status === BookingStatus.CONFIRMED ? currency(booking.totalCents) : booking.status}</span>{booking.tickets.length > 0 && <Link href="/tickets" className="text-xs font-bold text-[#e65e3f]">Tickets</Link>}</div></article>)}{bookings.length === 0 && <p className="py-6 text-sm text-[#686a62]">No bookings yet. Your next story is waiting.</p>}</div>
    </section>
  </DashboardShell>;
}

function DashboardShell({ name, role, children }: { name: string; role: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-5xl"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dedbd3] pb-5"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><nav className="flex flex-wrap items-center gap-4 text-xs font-semibold"><Link href="/profile">Profile</Link><Link href="/bookings">Bookings</Link><Link href="/tickets">Tickets</Link><span className="hidden text-[#686a62] sm:inline">{name}</span><SignOutButton /></nav></header><div className="mt-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">{role} dashboard</p><h1 className="mt-2 font-serif text-4xl">Good to see you, {name.split(" ")[0]}.</h1><div className="mt-8">{children}</div></div></div></main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-t border-[#c9c6bd] pt-4"><p className="text-xs text-[#686a62]">{label}</p><p className="mt-2 font-serif text-3xl">{value}</p></div>;
}

function SignOutButton() {
  return <form action={async () => { "use server"; const { clearSession } = await import("@/lib/auth"); const { redirect } = await import("next/navigation"); await clearSession(); redirect("/"); }}><button className="text-xs font-semibold text-[#e65e3f]">Sign out</button></form>;
}