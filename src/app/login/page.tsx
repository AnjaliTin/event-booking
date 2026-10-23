import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-[#22241f]">
    <Link href="/" className="font-serif text-2xl font-bold">side<span className="text-[#e65e3f]">/</span>stage</Link>
    <section className="mx-auto mt-16 max-w-md border-t-2 border-[#22241f] pt-8">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e65e3f]">Welcome back</p><h1 className="mt-2 font-serif text-4xl">Sign in to your account.</h1>
      <AuthForm mode="login" />
      <p className="mt-4 text-center text-sm text-[#686a62]">Need to verify your email? <Link href="/verify-email" className="font-semibold underline decoration-[#e65e3f] underline-offset-4">Enter a verification code</Link></p>
      <p className="mt-6 text-sm text-[#686a62]">New to Side Stage? <Link href="/signup" className="font-semibold text-[#22241f] underline decoration-[#e65e3f] underline-offset-4">Create an account</Link></p>
    </section>
  </main>;
}