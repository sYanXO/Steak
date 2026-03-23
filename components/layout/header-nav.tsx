"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/groups", label: "Groups" },
  { href: "/admin", label: "Admin" }
] satisfies Array<{ href: Route; label: string }>;

type HeaderNavProps = {
  isAdmin: boolean;
};

function isMinimalPublicRoute(pathname: string) {
  return pathname === "/" || pathname === "/sign-in" || pathname === "/sign-up";
}

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav({ isAdmin }: HeaderNavProps) {
  const pathname = usePathname();

  if (isMinimalPublicRoute(pathname)) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      {NAV_ITEMS.filter((item) => (item.href === "/admin" ? isAdmin : true)).map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-2 font-medium transition",
              active
                ? "border border-[var(--line)] bg-[var(--surface-strong)] text-[var(--foreground)] shadow-[var(--shadow)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
