const CRICKETDATA_PROVIDER = "CRICKETDATA";
const CRICKETDATA_BASE_URL = "https://api.cricapi.com/v1";

type CricketDataTeam = {
  name?: string;
  shortname?: string;
};

type CricketDataMatch = {
  id?: string;
  name?: string;
  matchType?: string;
  status?: string;
  date?: string;
  dateTimeGMT?: string;
  series?: string;
  seriesName?: string;
  series_id?: string;
  tournament?: string;
  competition?: string;
  teams?: string[];
  teamInfo?: CricketDataTeam[];
  tossWinner?: string;
  tossChoice?: string;
  winner?: string;
  matchWinner?: string;
};

type CricketDataResponse = {
  status?: string;
  data?: CricketDataMatch[];
};

const IPL_KEYWORDS = ["ipl", "indian premier league", "tata ipl"];

export type ProviderMatchRecord = {
  provider: string;
  providerMatchId: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: Date;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  tossWinner: string | null;
  tossDecision: string | null;
  winnerTeam: string | null;
  completedAt: Date | null;
  rawStatus: string | null;
  matchType: string | null;
};

function normalizeStatus(rawStatus: string | undefined, winnerTeam: string | null) {
  const status = (rawStatus ?? "").toLowerCase();

  if (winnerTeam || status.includes("won") || status.includes("result")) {
    return "COMPLETED" as const;
  }

  if (status.includes("live") || status.includes("innings") || status.includes("break")) {
    return "LIVE" as const;
  }

  if (status.includes("cancel") || status.includes("abandon")) {
    return "CANCELLED" as const;
  }

  return "SCHEDULED" as const;
}

function getTeams(match: CricketDataMatch) {
  const teamInfoNames = match.teamInfo
    ?.map((team) => team.name?.trim() || team.shortname?.trim() || "")
    .filter(Boolean) ?? [];

  const teams = teamInfoNames.length >= 2 ? teamInfoNames : (match.teams ?? []).filter(Boolean);

  if (teams.length < 2) {
    return null;
  }

  return {
    homeTeam: teams[0],
    awayTeam: teams[1]
  };
}

function getStartsAt(match: CricketDataMatch) {
  const raw = match.dateTimeGMT ?? match.date;

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTitle(match: CricketDataMatch, homeTeam: string, awayTeam: string) {
  const name = match.name?.trim();

  if (name) {
    return name;
  }

  return `${homeTeam} vs ${awayTeam}`;
}

function toProviderMatch(match: CricketDataMatch): ProviderMatchRecord | null {
  const providerMatchId = String(match.id ?? "").trim();
  const teams = getTeams(match);
  const startsAt = getStartsAt(match);
  const winnerTeam = match.winner?.trim() || match.matchWinner?.trim() || null;

  if (!providerMatchId || !teams || !startsAt) {
    return null;
  }

  return {
    provider: CRICKETDATA_PROVIDER,
    providerMatchId,
    title: getTitle(match, teams.homeTeam, teams.awayTeam),
    homeTeam: teams.homeTeam,
    awayTeam: teams.awayTeam,
    startsAt,
    status: normalizeStatus(match.status, winnerTeam),
    tossWinner: match.tossWinner?.trim() || null,
    tossDecision: match.tossChoice?.trim() || null,
    winnerTeam,
    completedAt: winnerTeam ? new Date() : null,
    rawStatus: match.status?.trim() || null,
    matchType: match.matchType?.trim() || null
  };
}

function isIplMatch(match: CricketDataMatch) {
  const searchBlob = (match.name ?? "").toLowerCase();

  return IPL_KEYWORDS.some((keyword) => searchBlob.includes(keyword));
}

async function fetchMatches(endpoint: string, apiKey: string) {
  const response = await fetch(`${CRICKETDATA_BASE_URL}/${endpoint}?apikey=${apiKey}`, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`CricketData request failed with status ${response.status}.`);
  }

  const body = (await response.json()) as CricketDataResponse;

  return (body.data ?? [])
    .filter(isIplMatch)
    .map(toProviderMatch)
    .filter((match): match is ProviderMatchRecord => Boolean(match));
}

export async function fetchCricketDataMatches(apiKey: string) {
  const [upcoming, current] = await Promise.all([
    fetchMatches("matches", apiKey),
    fetchMatches("currentMatches", apiKey)
  ]);

  const deduped = new Map<string, ProviderMatchRecord>();

  for (const match of [...upcoming, ...current]) {
    deduped.set(match.providerMatchId, match);
  }

  return Array.from(deduped.values());
}
