"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Button } from "@/components/ui/button";

type HeaderActionsProps = {
  isAuthenticated: boolean;
};

function isMinimalPublicRoute(pathname: string) {
  return pathname === "/sign-in" || pathname === "/sign-up";
}

export function HeaderActions({ isAuthenticated }: HeaderActionsProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ThemeToggle />
      {isAuthenticated ? (
        <SignOutButton />
      ) : isMinimalPublicRoute(pathname) ? null : (
        <>
          <Button
            asChild
            variant="secondary"
            className="text-[var(--foreground)]"
          >
            <Link href="/sign-in" className="text-[var(--foreground)]">
              Sign in
            </Link>
          </Button>
          <Button
            asChild
            className="bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]"
          >
            <Link href="/sign-up" className="text-white">
              Create account
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
