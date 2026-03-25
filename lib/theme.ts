export const THEME_STORAGE_KEY = "stake-ipl-theme";

export const themeScript = `
(() => {
  const storageKey = "${THEME_STORAGE_KEY}";
  const storedTheme = window.localStorage.getItem(storageKey);
  const theme =
    storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
})();
`;
