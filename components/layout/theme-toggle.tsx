"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const preferredTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    applyTheme(preferredTheme);
    setTheme(preferredTheme);
    setReady(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!ready}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === "dark"}
      className="relative inline-flex h-10 w-18 items-center rounded-full border border-[var(--line)] bg-[var(--theme-chip)] px-1 text-[var(--foreground)] shadow-[var(--shadow)] transition hover:bg-[var(--theme-chip-hover)] disabled:opacity-70"
    >
      <span className="absolute left-2.5">
        <Sun className="size-4" />
      </span>
      <span className="absolute right-2.5">
        <Moon className="size-4" />
      </span>
      <span
        className={`absolute top-1 flex size-8 items-center justify-center rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-fg)] transition-transform ${
          theme === "dark" ? "translate-x-8" : "translate-x-0"
        }`}
      >
        {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </span>
    </button>
  );
}
