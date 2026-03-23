import { z } from "zod";

export const createRecoveryRequestSchema = z.object({
  requestedEmail: z.string().trim().email("Enter a valid requested email."),
  reason: z.string().trim().min(12, "Explain the issue in at least 12 characters.").max(500)
});

export const resolveRecoveryRequestSchema = z.object({
  requestId: z.string().min(1, "Invalid recovery request."),
  email: z.string().trim().email("Enter a valid replacement email.")
});
