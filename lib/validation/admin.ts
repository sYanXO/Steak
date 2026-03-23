import { z } from "zod";

export const settleMarketSchema = z.object({
  marketId: z.string().min(1, "Invalid market selection."),
  outcomeId: z.string().min(1, "Invalid outcome selection.")
});

export const createMatchSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(120),
  homeTeam: z.string().trim().min(2, "Home team is too short.").max(60),
  awayTeam: z.string().trim().min(2, "Away team is too short.").max(60),
  startsAt: z.string().datetime("Enter a valid datetime.")
});

export const createMarketSchema = z.object({
  matchId: z.string().min(1, "Select a match."),
  title: z.string().trim().min(3, "Title is too short.").max(120),
  type: z.string().trim().min(3, "Type is too short.").max(60),
  opensAt: z.string().datetime("Enter a valid open time."),
  closesAt: z.string().datetime("Enter a valid close time."),
  outcomes: z
    .string()
    .trim()
    .min(3, "Provide at least two outcomes.")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .refine((items) => items.length >= 2, "Provide at least two outcomes.")
    .refine((items) => new Set(items).size === items.length, "Outcome labels must be unique.")
});

export const updateMarketStatusSchema = z.object({
  marketId: z.string().min(1, "Invalid market selection."),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "VOID"], {
    message: "Invalid market status."
  })
});

export const manualTopUpSchema = z.object({
  userId: z.string().min(1, "Select a user."),
  amount: z.coerce
    .number()
    .int("Top-up amount must be a whole number.")
    .min(1, "Top-up amount must be positive.")
    .max(1000000, "Top-up amount is too large."),
  reason: z.string().trim().min(3, "Reason is too short.").max(200)
});
