import { z } from "zod";

export const placeStakeSchema = z.object({
  marketId: z.string().min(1, "Invalid market selection."),
  outcomeId: z.string().min(1, "Invalid outcome selection."),
  amount: z.coerce
    .number()
    .int("Stake amount must be a whole number of coins.")
    .min(10, "Minimum stake is 10 coins.")
    .max(100000, "Stake amount is too large.")
});
