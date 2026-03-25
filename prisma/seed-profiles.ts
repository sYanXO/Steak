export type SeedProfile = "local-demo" | "staging-demo" | "production-safe";

import { isLocalDatabaseUrl } from "@/prisma/safety";

type DemoSeedConfig = {
  profile: Extract<SeedProfile, "local-demo" | "staging-demo">;
  admin: {
    email: string;
    name: string;
    password: string;
  };
  user: {
    email: string;
    name: string;
    password: string;
  };
  match: {
    id: string;
    title: string;
    homeTeam: string;
    awayTeam: string;
  };
  market: {
    id: string;
    title: string;
    type: string;
  };
};

const demoSeedProfiles: Record<DemoSeedConfig["profile"], DemoSeedConfig> = {
  "local-demo": {
    profile: "local-demo",
    admin: {
      email: "admin@stakeipl.app",
      name: "Admin User",
      password: "adminpass123"
    },
    user: {
      email: "captain@stakeipl.app",
      name: "Demo Player",
      password: "userpass123"
    },
    match: {
      id: "seed-match-mi-csk",
      title: "Mumbai Indians vs Chennai Super Kings",
      homeTeam: "Mumbai Indians",
      awayTeam: "Chennai Super Kings"
    },
    market: {
      id: "seed-market-mi-csk-winner",
      title: "Match winner",
      type: "MATCH_WINNER"
    }
  },
  "staging-demo": {
    profile: "staging-demo",
    admin: {
      email: "staging-admin@stakeipl.app",
      name: "Staging Admin",
      password: "adminpass123"
    },
    user: {
      email: "staging-player@stakeipl.app",
      name: "Staging Demo Player",
      password: "userpass123"
    },
    match: {
      id: "staging-seed-match-mi-csk",
      title: "Staging Demo: Mumbai Indians vs Chennai Super Kings",
      homeTeam: "Mumbai Indians",
      awayTeam: "Chennai Super Kings"
    },
    market: {
      id: "staging-seed-market-mi-csk-winner",
      title: "Staging demo match winner",
      type: "MATCH_WINNER"
    }
  }
};

export function resolveSeedProfile(
  rawValue = process.env.SEED_PROFILE,
  databaseUrl = process.env.DATABASE_URL
): SeedProfile {
  const normalized = rawValue?.trim().toLowerCase();

  if (!normalized) {
    return isLocalDatabaseUrl(databaseUrl) ? "local-demo" : "production-safe";
  }

  if (
    normalized === "local-demo" ||
    normalized === "staging-demo" ||
    normalized === "production-safe"
  ) {
    return normalized;
  }

  throw new Error(
    `Invalid SEED_PROFILE "${rawValue}". Expected local-demo, staging-demo, or production-safe.`
  );
}

export function getDemoSeedConfig(profile: DemoSeedConfig["profile"]) {
  return demoSeedProfiles[profile];
}
