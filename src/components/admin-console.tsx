"use client";

import { useEffect, useState } from "react";

type PendingEvent = { id: string; title: string; category: string; city: string; organizer: { name: string } };
type OrganizerRequest = { id: string; name: string; email: string; createdAt: string };
type ManagedUser = { id: string; name: string; email: string; role: "ATTENDEE" | "ORGANIZER" | "ADMIN"; isActive: boolean; isEmailVerified: boolean; organizerRequest: string | null };

export function AdminConsole() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function requestJson(path: string, init?: RequestInit) {
    const response = await fetch(path, init);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "Request failed.");
    return result.data;
  }

  async function refresh() {
    const [pendingEvents, organizerRequests, managedUsers] = await Promise.all([
      requestJson("/api/v1/admin/events/pending"),
      requestJson("/api/v1/admin/organizer-requests"),
      requestJson(`/api/v1/admin/users?q=${encodeURIComponent(search)}`),
    ]);
    setEvents(pendingEvents);
    setRequests(organizerRequests);
    setUsers(managedUsers);
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/v1/admin/events/pending").then((response) => response.json()),
      fetch("/api/v1/admin/organizer-requests").then((response) => response.json()),
      fetch("/api/v1/admin/users").then((response) => response.json()),
    ]).then(([eventResult, requestResult, userResult]) => {
      if (!active) return;
      const failed = [eventResult, requestResult, userResult].find((result) => result.error);
      if (failed) throw new Error(failed.error.message ?? "Could not load admin data.");
      setEvents(eventResult.data);
      setRequests(requestResult.data);
      setUsers(userResult.data);
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load admin data."); });
    return () => { active = false; };
  }, []);

  async function decideEvent(eventId: string, decision: "approve" | "reject") {
    setBusy(eventId);
    setError("");
    try {
      await requestJson(`/api/v1/admin/events/${eventId}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not review event.");
    } finally { setBusy(""); }
  }

  async function decideOrganizer(userId: string, decision: "approve" | "reject") {
    setBusy(userId);
    setError("");
    try {
      await requestJson("/api/v1/admin/organizer-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, decision }) });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not review request.");
    } finally { setBusy(""); }
  }

  async function updateUser(userId: string, patch: { role?: string; isActive?: boolean }) {
    setBusy(userId);
    setError("");
    try {
      await requestJson("/api/v1/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ...patch }) });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update account.");
    } finally { setBusy(""); }
  }

  return <div>
    {error && <p role="alert" className="mb-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    <section><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Event moderation</p><h2 className="mt-2 font-serif text-3xl">Approvals <span className="font-sans text-sm text-[#777970]">{events.length}</span></h2></div><div className="mt-4 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">{events.map((event) => <article key={event.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">{event.title}</h3><p className="mt-1 text-xs text-[#686a62]">{event.category} · {event.city} · {event.organizer.name}</p></div><div className="flex gap-2"><button disabled={busy === event.id} onClick={() => void decideEvent(event.id, "reject")} className="border border-[#c9c6bd] px-3 py-2 text-xs font-semibold">Reject</button><button disabled={busy === event.id} onClick={() => void decideEvent(event.id, "approve")} className="bg-[#22241f] px-3 py-2 text-xs font-semibold text-white">Approve</button></div></article>)}{events.length === 0 && <p className="py-5 text-sm text-[#686a62]">No pending events.</p>}</div></section>
    <section className="mt-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Access review</p><h2 className="mt-2 font-serif text-3xl">Organizer requests <span className="font-sans text-sm text-[#777970]">{requests.length}</span></h2><div className="mt-4 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">{requests.map((request) => <article key={request.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">{request.name}</h3><p className="mt-1 text-xs text-[#686a62]">{request.email}</p></div><div className="flex gap-2"><button disabled={busy === request.id} onClick={() => void decideOrganizer(request.id, "reject")} className="border border-[#c9c6bd] px-3 py-2 text-xs font-semibold">Reject</button><button disabled={busy === request.id} onClick={() => void decideOrganizer(request.id, "approve")} className="bg-[#22241f] px-3 py-2 text-xs font-semibold text-white">Approve</button></div></article>)}{requests.length === 0 && <p className="py-5 text-sm text-[#686a62]">No pending access requests.</p>}</div></section>
    <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Platform accounts</p><h2 className="mt-2 font-serif text-3xl">Users</h2></div><form onSubmit={(event) => { event.preventDefault(); void refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not search users.")); }} className="flex border-b border-[#a9aaa3]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a person" className="bg-transparent px-2 py-2 text-sm outline-none" /><button aria-label="Search users" className="px-2 text-sm">⌕</button></form></div><div className="mt-4 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">{users.map((user) => <article key={user.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><h3 className="truncate font-semibold">{user.name}</h3><p className="truncate text-xs text-[#686a62]">{user.email} · {user.isEmailVerified ? "verified" : "unverified"} · {user.isActive ? "active" : "suspended"}</p></div><div className="flex flex-wrap items-center gap-2"><select aria-label={`Role for ${user.name}`} value={user.role} onChange={(event) => void updateUser(user.id, { role: event.target.value })} disabled={busy === user.id} className="border border-[#d6d2c9] bg-white px-2 py-2 text-xs"><option value="ATTENDEE">Attendee</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select><button disabled={busy === user.id} onClick={() => void updateUser(user.id, { isActive: !user.isActive })} className="border border-[#c9c6bd] px-3 py-2 text-xs font-semibold">{user.isActive ? "Suspend" : "Reactivate"}</button></div></article>)}{users.length === 0 && <p className="py-5 text-sm text-[#686a62]">No matching accounts.</p>}</div></section>
  </div>;
}