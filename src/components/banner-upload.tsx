"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type UploadSignature = { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string };

type CloudinaryUpload = { secure_url: string };

export function BannerUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("The image must be 8 MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const signedResponse = await fetch("/api/v1/uploads/banner-signature", { method: "POST" });
      const signedPayload = await signedResponse.json();
      if (!signedResponse.ok) throw new Error(signedPayload.error?.message ?? "Could not prepare the upload.");
      const signed: UploadSignature = signedPayload.data;
      const form = new FormData();
      form.set("file", file);
      form.set("api_key", signed.apiKey);
      form.set("timestamp", String(signed.timestamp));
      form.set("folder", signed.folder);
      form.set("signature", signed.signature);

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, { method: "POST", body: form });
      const uploadPayload = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error("Cloud image storage rejected the upload. Check the Cloudinary configuration and try again.");
      onChange((uploadPayload as CloudinaryUpload).secure_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return <div className="sm:col-span-2">
    <label className="block text-sm font-medium">Event banner <span className="font-normal text-[#777970]">(JPG, PNG, or WebP; up to 8 MB)</span></label>
    <div className="mt-2 flex flex-wrap items-center gap-4">
      {value && <Image src={value} alt="Selected event banner preview" width={192} height={112} unoptimized className="h-28 w-48 object-cover" />}
      <div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void upload(event.currentTarget.files?.[0])} />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="border border-[#22241f] px-4 py-2.5 text-sm font-semibold hover:bg-[#22241f] hover:text-white disabled:opacity-60">{busy ? "Uploading…" : value ? "Replace banner" : "Choose banner image"}</button>
        {value && <button type="button" onClick={() => onChange("")} className="ml-3 text-sm text-[#686a62] underline underline-offset-4">Remove</button>}
        <p className="mt-2 max-w-sm text-xs leading-5 text-[#777970]">Images are uploaded to the configured Cloudinary account and stored as a public event banner.</p>
      </div>
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <input type="hidden" name="bannerUrl" value={value} />
  </div>;
}
