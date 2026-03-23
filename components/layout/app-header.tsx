import Link from "next/link";
import { auth } from "@/auth";
import { HeaderActions } from "@/components/layout/header-actions";
import { HeaderNav } from "@/components/layout/header-nav";

export async function AppHeader() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="app-shell pt-6">
      <div className="glass-panel flex flex-col gap-4 rounded-[28px] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Stake IPL
          </Link>
          {isAuthenticated ? <HeaderNav isAdmin={isAdmin} /> : null}
        </div>

        <HeaderActions isAuthenticated={isAuthenticated} />
      </div>
    </header>
  );
}
