"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ScanResult = { checkedIn: boolean; ticketId: string; eventTitle: string };

export default function CheckInPage() {
  const router = useRouter();
  const [scannerReady, setScannerReady] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [manualId, setManualId] = useState("");
  const [busy, setBusy] = useState(false);
  const checkInLock = useRef(false);
  const verifyTicketRef = useRef<(ticketId: string) => Promise<void>>(async () => undefined);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | undefined;
    let active = true;
    void import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      const reader = new Html5Qrcode("sidestage-qr-reader");
      scanner = reader;
      try {
        await reader.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, (decodedText) => { if (active) void verifyTicketRef.current(decodedText); }, () => undefined);
        if (active) setScannerReady(true);
      } catch {
        if (active) setError("Camera could not start. Allow camera access or enter the ticket code manually.");
      }
    }).catch(() => { if (active) setError("QR scanner could not load. Enter the ticket code manually."); });
    return () => {
      active = false;
      if (scanner) void scanner.stop().catch(() => undefined).finally(() => scanner?.clear());
    };
  }, []);

  useEffect(() => {
    verifyTicketRef.current = verifyTicket;
  });

  async function verifyTicket(ticketId: string) {
    if (!ticketId || checkInLock.current) return;
    checkInLock.current = true;
    setBusy(true);
    setError("");
    setScanResult(null);
    try {
      const response = await fetch("/api/v1/check-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId }) });
      const result = await response.json();
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error(result.error?.message ?? "Ticket could not be checked in.");
      setScanResult(result.data);
      setManualId("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ticket could not be checked in.");
    } finally {
      checkInLock.current = false;
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f] sm:px-10"><div className="mx-auto max-w-2xl"><header className="flex items-center justify-between border-b border-[#dedbd3] pb-5"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><Link href="/dashboard" className="text-sm font-semibold underline decoration-[#e65e3f] underline-offset-4">Dashboard</Link></header><section className="mt-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#e65e3f]">Door desk</p><h1 className="mt-2 font-serif text-4xl">Scan a ticket.</h1><p className="mt-2 text-sm text-[#686a62]">Each valid ticket can be checked in once, for your events only.</p><div id="sidestage-qr-reader" className="mt-7 min-h-64 overflow-hidden border border-[#dedbd3] bg-white" aria-label="QR code scanner" />{scannerReady && <p className="mt-2 text-xs text-[#686a62]">Camera scanner ready.</p>}<form onSubmit={(event) => { event.preventDefault(); void verifyTicket(manualId); }} className="mt-6 flex gap-2"><label className="sr-only" htmlFor="ticket-code">Ticket code</label><input id="ticket-code" value={manualId} onChange={(event) => setManualId(event.target.value)} placeholder="Or enter ticket code" className="min-w-0 flex-1 border border-[#d6d2c9] bg-white px-3 py-3 font-mono text-sm" /><button disabled={busy || !manualId} className="bg-[#22241f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Check in</button></form>{busy && <p className="mt-4 text-sm text-[#686a62]">Verifying ticket…</p>}{error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">{error}</p>}{scanResult && <div role="status" className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-4"><p className="text-xs font-bold uppercase tracking-[.13em] text-emerald-800">Check-in complete</p><p className="mt-1 font-semibold">{scanResult.eventTitle}</p><p className="mt-1 break-all font-mono text-xs text-emerald-900">{scanResult.ticketId}</p></div>}</section></div></main>;
}