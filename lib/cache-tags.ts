export const cacheTags = {
  homepage: "homepage-data",
  dashboard: (userId: string) => `dashboard:${userId}`,
  market: (marketId: string) => `market:${marketId}`,
  admin: "admin:overview"
} as const;
