"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import {
  createRecoveryRequest,
  requestEmailChange,
  requestPasswordChange,
  updateAdminOwnProfile,
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

  logActionStart("profile.create-recovery-request", { userId: session.user.id });

  try {
    await createRecoveryRequest({
      userId: session.user.id,
      currentEmail: session.user.email,
      requestedEmail: String(formData.get("requestedEmail") ?? ""),
      reason: String(formData.get("reason") ?? "")
    });

    revalidatePath("/profile");
    revalidatePath("/admin");

    logActionSuccess("profile.create-recovery-request", { userId: session.user.id });

    return {
      success: "Recovery request submitted. Admin review is now required for an email correction."
    };
  } catch (error) {
    logActionError("profile.create-recovery-request", error, { userId: session.user.id });
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

  logActionStart("profile.request-email-change", { userId: session.user.id });

  try {
    const request = await requestEmailChange({
      userId: session.user.id,
      currentEmail: session.user.email,
      nextEmail: String(formData.get("nextEmail") ?? "")
    });

    revalidatePath("/profile");

    logActionSuccess("profile.request-email-change", {
      userId: session.user.id,
      requestId: request.id
    });

    return {
      success: `OTP sent for email change. Request ID: ${request.id}`
    };
  } catch (error) {
    logActionError("profile.request-email-change", error, { userId: session.user.id });
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

  logActionStart("profile.request-password-change", { userId: session.user.id });

  try {
    const request = await requestPasswordChange({
      userId: session.user.id,
      currentEmail: session.user.email,
      nextPassword: String(formData.get("nextPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? "")
    });

    revalidatePath("/profile");

    logActionSuccess("profile.request-password-change", {
      userId: session.user.id,
      requestId: request.id
    });

    return {
      success: `OTP sent for password change. Request ID: ${request.id}`
    };
  } catch (error) {
    logActionError("profile.request-password-change", error, { userId: session.user.id });
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

  logActionStart("profile.verify-credential-otp", { userId: session.user.id });

  try {
    const type = await verifyCredentialOtp({
      userId: session.user.id,
      requestId: String(formData.get("requestId") ?? ""),
      otpCode: String(formData.get("otpCode") ?? "")
    });

    revalidatePath("/profile");

    logActionSuccess("profile.verify-credential-otp", {
      userId: session.user.id,
      type
    });

    return {
      success:
        type === "EMAIL"
          ? "Email updated successfully."
          : "Password updated successfully."
      };
  } catch (error) {
    logActionError("profile.verify-credential-otp", error, { userId: session.user.id });
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to verify OTP." };
  }
}

export async function updateAdminOwnProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  logActionStart("profile.update-admin-own-profile", { userId: session.user.id });

  try {
    const user = await updateAdminOwnProfile({
      userId: session.user.id,
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? "")
    });

    revalidatePath("/profile");

    logActionSuccess("profile.update-admin-own-profile", {
      userId: session.user.id,
      email: user.email
    });

    return {
      success: `Profile updated for ${user.email}. Sign out and sign back in to refresh your session email.`
    };
  } catch (error) {
    logActionError("profile.update-admin-own-profile", error, { userId: session.user.id });
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to update admin profile." };
  }
}
