import { z } from "zod";

export const requestEmailChangeSchema = z.object({
  nextEmail: z.string().trim().email("Enter a valid new email address.")
});

export const requestPasswordChangeSchema = z.object({
  nextPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm your password.")
}).refine((data) => data.nextPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match."
});

export const verifyCredentialOtpSchema = z.object({
  requestId: z.string().min(1, "Invalid credential request."),
  otpCode: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP.")
});
