import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center py-8">
      <Card className="w-full max-w-md rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Create account</p>
        <h1 className="mt-2 text-3xl font-bold">Join Stake IPL</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          New accounts receive 5000 virtual coins once, backed by a starter ledger entry.
        </p>
        <div className="mt-6">
          <SignUpForm />
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-[var(--accent-dark)]">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
