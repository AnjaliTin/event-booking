"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookingCancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancelBooking() {
    if (!window.confirm("Cancel this booking? This action cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}/cancel`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not cancel booking.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel booking.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex flex-col items-start gap-1">
    <button type="button" disabled={busy} onClick={() => void cancelBooking()} className="border border-[#c9c6bd] px-3 py-2 text-xs font-semibold hover:border-red-600 hover:text-red-700 disabled:opacity-50">
      {busy ? "Cancelling…" : "Cancel booking"}
    </button>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
