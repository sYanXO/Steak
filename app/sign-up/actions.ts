"use server";

import { redirect } from "next/navigation";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { consumeSignUpAttempt, formatRetryMessage } from "@/lib/rate-limit";
import { registerUser } from "@/lib/services/register-user";
import { signUpSchema } from "@/lib/validation/auth";

export type SignUpActionState = {
  error?: string;
};

type SignUpActionDeps = {
  consumeSignUpAttempt: typeof consumeSignUpAttempt;
  formatRetryMessage: typeof formatRetryMessage;
  registerUser: typeof registerUser;
  logActionStart: typeof logActionStart;
  logActionSuccess: typeof logActionSuccess;
  logActionError: typeof logActionError;
  redirect: typeof redirect;
};

export function createSignUpAction(deps: SignUpActionDeps) {
  return async function signUpAction(
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

    const rateLimit = deps.consumeSignUpAttempt(parsed.data.email);

    if (!rateLimit.allowed) {
      return {
        error: deps.formatRetryMessage("sign-up", rateLimit.retryAfterSeconds)
      };
    }

    deps.logActionStart("auth.sign-up", { email: parsed.data.email.toLowerCase() });

    try {
      const user = await deps.registerUser(parsed.data);
      deps.logActionSuccess("auth.sign-up", { email: user.email, userId: user.id });
    } catch (error) {
      deps.logActionError("auth.sign-up", error, { email: parsed.data.email.toLowerCase() });
      if (error instanceof Error) {
        return { error: error.message };
      }

      return { error: "Unable to create your account." };
    }

    deps.redirect("/sign-in?registered=1");
    return {};
  };
}

export const signUpAction = createSignUpAction({
  consumeSignUpAttempt,
  formatRetryMessage,
  registerUser,
  logActionStart,
  logActionSuccess,
  logActionError,
  redirect
});
