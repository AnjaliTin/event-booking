import Link from "next/link";
import { AuthCodeForm } from "@/components/auth-code-form";

export default function VerifyEmailPage() {
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f]"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><section className="mx-auto mt-16 max-w-md border-t-2 border-[#22241f] pt-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">Email verification</p><h1 className="mt-2 font-serif text-4xl">One more little step.</h1><p className="mt-2 text-sm leading-6 text-[#686a62]">Enter the email you registered with. Verification codes expire after 10 minutes.</p><AuthCodeForm mode="verify" /><p className="mt-6 text-sm"><Link href="/login" className="underline decoration-[#e65e3f] underline-offset-4">Back to sign in</Link></p></section></main>;
}