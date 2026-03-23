const coinFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

const istDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
  timeZoneName: "short"
});

export function formatCoins(value: number) {
  return coinFormatter.format(value);
}

export function formatOdds(value: number) {
  return `${value.toFixed(2)}x`;
}

export function formatUtcDateTime(value: Date) {
  return istDateTimeFormatter.format(value);
}

export function formatRelativeDelta(value: number) {
  return `${value > 0 ? "+" : ""}${formatCoins(value)}`;
}
