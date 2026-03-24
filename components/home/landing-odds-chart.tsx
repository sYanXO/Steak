"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";
import { Activity, Radio, TrendingUp } from "lucide-react";
import { formatOdds } from "@/lib/format";

type MarketSnapshot = {
  title: string;
  outcomes: Array<{
    id: string;
    label: string;
    currentOdds: number;
    oddsSnapshots: Array<{
      recordedAt: string;
      oddsValue: number;
    }>;
  }>;
};

type ChartPoint = {
  time: string;
  primary: number;
  secondary: number;
};

export function LandingOddsChart({
  market
}: {
  market: MarketSnapshot | null;
}) {
  const primaryOutcome = market?.outcomes[0];
  const secondaryOutcome = market?.outcomes[1];
  const chartData = buildChartData(primaryOutcome, secondaryOutcome);

  return (
    <div className="min-w-[280px] max-w-[360px] rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-strong)_88%,transparent),color-mix(in_srgb,var(--panel-strong)_92%,transparent))] p-4 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
            Odds motion
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            {market?.title ?? "Match winner market"}
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
            Demo motion preview showing how quotes can compress and rebound across a market cycle.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--success)_36%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--success)] shadow-[0_0_18px_color-mix(in_srgb,var(--success)_18%,transparent)]">
          <Radio className="size-3" />
          <span>Live</span>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[var(--line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-strong)_70%,transparent),color-mix(in_srgb,var(--surface-soft)_88%,transparent))] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Activity className="size-3.5 text-[var(--accent-dark)]" />
            <span>Local-time preview</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)]">
            <TrendingUp className="size-3 text-[var(--success)]" />
            Demo curve
          </div>
        </div>

        <div className="h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="landing-primary" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-dark)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
                <linearGradient id="landing-secondary" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#56d19c" />
                  <stop offset="100%" stopColor="var(--success)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 8" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="time"
                tickLine={false}
                minTickGap={24}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                domain={["dataMin - 0.1", "dataMax + 0.1"]}
                tickFormatter={(value: number) => `${value.toFixed(1)}x`}
                tickLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                width={38}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    primaryLabel={primaryOutcome?.label}
                    secondaryLabel={secondaryOutcome?.label}
                  />
                }
                cursor={{ stroke: "var(--line)", strokeDasharray: "4 6" }}
              />
              <Line
                animationDuration={900}
                dataKey="primary"
                dot={false}
                stroke="url(#landing-primary)"
                strokeLinecap="round"
                strokeWidth={4}
                type="monotone"
                activeDot={{ fill: "var(--accent)", r: 6, stroke: "var(--background)", strokeWidth: 3 }}
              />
              <Line
                animationDuration={1050}
                dataKey="secondary"
                dot={false}
                stroke="url(#landing-secondary)"
                strokeLinecap="round"
                strokeWidth={4}
                type="monotone"
                activeDot={{ fill: "var(--success)", r: 6, stroke: "var(--background)", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <LegendPill
          accentClass="bg-[var(--accent)]"
          label={abbreviateTeam(primaryOutcome?.label ?? "Primary outcome")}
          odds={Number(primaryOutcome?.currentOdds ?? 0)}
        />
        <LegendPill
          accentClass="bg-[var(--success)]"
          label={abbreviateTeam(secondaryOutcome?.label ?? "Secondary outcome")}
          odds={Number(secondaryOutcome?.currentOdds ?? 0)}
        />
      </div>
    </div>
  );
}

function buildChartData(
  primaryOutcome?: MarketSnapshot["outcomes"][number],
  secondaryOutcome?: MarketSnapshot["outcomes"][number]
) {
  const primarySeries = buildSeries(Number(primaryOutcome?.currentOdds ?? 1.84), [
    0.22,
    0.11,
    -0.08,
    0.06,
    -0.04
  ]);
  const secondarySeries = buildSeries(Number(secondaryOutcome?.currentOdds ?? 2.22), [
    -0.18,
    -0.09,
    0.12,
    -0.03,
    0.04
  ]);
  const labels = buildIstTimelineLabels(primarySeries.length);

  return labels.map((time, index) => ({
    time,
    primary: primarySeries[index],
    secondary: secondarySeries[index]
  }));
}

function buildSeries(base: number, deltas: number[]) {
  return deltas.reduce<number[]>(
    (points, delta) => [...points, Math.max(1.05, Number((points.at(-1)! + delta).toFixed(2)))],
    [Number(base.toFixed(2))]
  );
}

function buildIstTimelineLabels(count: number) {
  const now = new Date();
  const rounded = new Date(now);
  rounded.setMinutes(Math.floor(rounded.getMinutes() / 20) * 20, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const point = new Date(rounded);
    point.setMinutes(point.getMinutes() - (count - 1 - index) * 20);
    return formatLocalTime(point);
  });
}

function formatLocalTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

function abbreviateTeam(label: string) {
  const cleaned = label.trim();

  if (cleaned.length <= 8) {
    return cleaned.toUpperCase();
  }

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return cleaned.slice(0, 8).toUpperCase();
  }

  const abbreviation = words.map((word) => word[0]).join("").toUpperCase();
  return abbreviation.slice(0, 4);
}

function ChartTooltip({
  active,
  label,
  payload,
  primaryLabel,
  secondaryLabel
}: TooltipProps<number, string> & {
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const primary = payload.find((entry) => entry.dataKey === "primary")?.value;
  const secondary = payload.find((entry) => entry.dataKey === "secondary")?.value;

  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <div className="mt-2 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--muted)]">
            {abbreviateTeam(primaryLabel ?? "Primary")}
          </span>
          <span className="font-semibold">{formatOdds(Number(primary ?? 0))}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--muted)]">
            {abbreviateTeam(secondaryLabel ?? "Secondary")}
          </span>
          <span className="font-semibold">{formatOdds(Number(secondary ?? 0))}</span>
        </div>
      </div>
    </div>
  );
}

function LegendPill({
  accentClass,
  label,
  odds
}: {
  accentClass: string;
  label: string;
  odds: number;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${accentClass}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold">{formatOdds(odds)}</span>
      </div>
    </div>
  );
}
