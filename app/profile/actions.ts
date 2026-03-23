"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createRecoveryRequest,
  requestEmailChange,
  requestPasswordChange,
  verifyCredentialOtp
} from "@/lib/services/profile";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function createRecoveryRequestAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { error: "Sign in required." };
  }

  try {
    await createRecoveryRequest({
      userId: session.user.id,
      currentEmail: session.user.email,
      requestedEmail: String(formData.get("requestedEmail") ?? ""),
      reason: String(formData.get("reason") ?? "")
    });

    revalidatePath("/profile");
    revalidatePath("/admin");

    return {
      success: "Recovery request submitted. Admin review is now required for an email correction."
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to submit recovery request." };
  }
}

export async function requestEmailChangeAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { error: "Sign in required." };
  }

  try {
    const request = await requestEmailChange({
      userId: session.user.id,
      currentEmail: session.user.email,
      nextEmail: String(formData.get("nextEmail") ?? "")
    });

    revalidatePath("/profile");

    return {
      success: `OTP sent for email change. Request ID: ${request.id}`
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to request email change." };
  }
}

export async function requestPasswordChangeAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { error: "Sign in required." };
  }

  try {
    const request = await requestPasswordChange({
      userId: session.user.id,
      currentEmail: session.user.email,
      nextPassword: String(formData.get("nextPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? "")
    });

    revalidatePath("/profile");

    return {
      success: `OTP sent for password change. Request ID: ${request.id}`
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to request password change." };
  }
}

export async function verifyCredentialOtpAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in required." };
  }

  try {
    const type = await verifyCredentialOtp({
      userId: session.user.id,
      requestId: String(formData.get("requestId") ?? ""),
      otpCode: String(formData.get("otpCode") ?? "")
    });

    revalidatePath("/profile");

    return {
      success:
        type === "EMAIL"
          ? "Email updated successfully."
          : "Password updated successfully."
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to verify OTP." };
  }
}
