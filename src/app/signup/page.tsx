import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f]">
    <Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link>
    <section className="mx-auto mt-12 max-w-md border-t-2 border-[#22241f] pt-8">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">Your next good plan</p><h1 className="mt-2 font-serif text-4xl">Make yourself at home.</h1>
      <AuthForm mode="register" />
      <p className="mt-6 text-sm text-[#686a62]">Already have an account? <Link href="/login" className="font-semibold text-[#22241f] underline decoration-[#e65e3f] underline-offset-4">Sign in</Link></p>
    </section>
  </main>;
}