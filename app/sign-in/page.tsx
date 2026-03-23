import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const showRegisteredBanner = params.registered === "1";
  const showGoogle = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  return (
    <main className="app-shell flex min-h-screen items-center justify-center py-8">
      <Card className="w-full max-w-md rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Access</p>
        <h1 className="mt-2 text-3xl font-bold">Sign in to Stake IPL</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Email and Google auth will share the same wallet and leaderboard context.
        </p>
        {showRegisteredBanner ? (
          <p className="mt-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-success-border)", background: "var(--alert-success-bg)", color: "var(--alert-success-text)" }}>
            Account created. Sign in to access your starter balance.
          </p>
        ) : null}
        <div className="mt-6">
          <SignInForm showGoogle={showGoogle} />
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          No account yet? Starter balance is granted once at registration.{" "}
          <Link href="/sign-up" className="font-semibold text-[var(--accent-dark)]">
            Create one now
          </Link>
        </p>
      </Card>
    </main>
  );
}
