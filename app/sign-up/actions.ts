"use server";

import { redirect } from "next/navigation";
import { consumeSignUpAttempt, formatRetryMessage } from "@/lib/rate-limit";
import { registerUser } from "@/lib/services/register-user";
import { signUpSchema } from "@/lib/validation/auth";

export type SignUpActionState = {
  error?: string;
};

export async function signUpAction(
  _prevState: SignUpActionState,
  formData: FormData
): Promise<SignUpActionState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? "")
  };

  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to create your account."
    };
  }

  const rateLimit = consumeSignUpAttempt(parsed.data.email);

  if (!rateLimit.allowed) {
    return {
      error: formatRetryMessage("sign-up", rateLimit.retryAfterSeconds)
    };
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to create your account." };
  }

  redirect("/sign-in?registered=1");
}
