"use server";

import { redirect } from "next/navigation";
import { createSignUpAction } from "@/lib/action-factories/sign-up";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { consumeSignUpAttempt, formatRetryMessage } from "@/lib/rate-limit";
import { registerUser } from "@/lib/services/register-user";

export type { SignUpActionState } from "@/lib/action-factories/sign-up";

export const signUpAction = createSignUpAction({
  consumeSignUpAttempt,
  formatRetryMessage,
  registerUser,
  logActionStart,
  logActionSuccess,
  logActionError,
  redirect
});
