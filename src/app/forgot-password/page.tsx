import Link from "next/link";
import { AuthCodeForm } from "@/components/auth-code-form";

export default function ForgotPasswordPage() {
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f]"><Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link><section className="mx-auto mt-16 max-w-md border-t-2 border-[#22241f] pt-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">Account recovery</p><h1 className="mt-2 font-serif text-4xl">Reset your password.</h1><p className="mt-2 text-sm leading-6 text-[#686a62]">We’ll send a short-lived code if an account matches that email.</p><AuthCodeForm mode="reset" /><p className="mt-6 text-sm"><Link href="/login" className="underline decoration-[#e65e3f] underline-offset-4">Back to sign in</Link></p></section></main>;
}