"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { cacheTags } from "@/lib/cache-tags";
import {
  createMarket,
  createMatch,
  manualTopUp,
  updateMatch,
  updateMarketStatus
} from "@/lib/services/admin-operations";
import { resolveRecoveryRequest } from "@/lib/services/profile";
import { settleMarket } from "@/lib/services/settle-market";

export type SettleMarketActionState = {
  error?: string;
  success?: string;
};

export type AdminCreateActionState = {
  error?: string;
  success?: string;
};

export type AdminMutationActionState = {
  error?: string;
  success?: string;
  meta?: {
    refundedStakeCount?: number;
  };
};

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function normalizeDateTimeLocal(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) {
    return raw;
  }

  const [, year, month, day, hour, minute] = match;
  const utcMillis =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ) -
    (5 * 60 + 30) * 60 * 1000;

  const parsed = new Date(utcMillis);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toISOString();
}

export async function settleMarketAction(
  marketId: string,
  _prevState: SettleMarketActionState,
  formData: FormData
): Promise<SettleMarketActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  try {
    const result = await settleMarket({
      marketId,
      outcomeId: String(formData.get("outcomeId") ?? ""),
      adminId: session.user.id
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath(`/markets/${marketId}`);
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.market(marketId));
    revalidateTag(cacheTags.admin);

    return {
      success: `Settled ${result.settledStakeCount} stake(s) for ${result.settledOutcome}.`
    };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Unable to settle market.") };
  }
}

export async function createMatchAction(
  _prevState: AdminCreateActionState,
  formData: FormData
): Promise<AdminCreateActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  try {
    const match = await createMatch({
      title: String(formData.get("title") ?? ""),
      homeTeam: String(formData.get("homeTeam") ?? ""),
      awayTeam: String(formData.get("awayTeam") ?? ""),
      startsAt: normalizeDateTimeLocal(formData.get("startsAt")),
      adminId: session.user.id
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.admin);

    return {
      success: `Created match ${match.homeTeam} vs ${match.awayTeam}.`
    };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Unable to create match.") };
  }
}

export async function createMarketAction(
  _prevState: AdminCreateActionState,
  formData: FormData
): Promise<AdminCreateActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  try {
    const market = await createMarket({
      matchId: String(formData.get("matchId") ?? ""),
      title: String(formData.get("title") ?? ""),
      type: String(formData.get("type") ?? ""),
      opensAt: normalizeDateTimeLocal(formData.get("opensAt")),
      closesAt: normalizeDateTimeLocal(formData.get("closesAt")),
      outcomes: String(formData.get("outcomes") ?? ""),
      adminId: session.user.id
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/markets/${market.id}`);
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.market(market.id));
    revalidateTag(cacheTags.admin);

    return {
      success: `Created market ${market.title}.`
    };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Unable to create market.") };
  }
}

export async function updateMatchAction(
  matchId: string,
  _prevState: AdminMutationActionState,
  formData: FormData
): Promise<AdminMutationActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  try {
    const match = await updateMatch({
      matchId,
      title: String(formData.get("title") ?? ""),
      homeTeam: String(formData.get("homeTeam") ?? ""),
      awayTeam: String(formData.get("awayTeam") ?? ""),
      startsAt: normalizeDateTimeLocal(formData.get("startsAt")),
      status: String(formData.get("status") ?? "") as
        | "SCHEDULED"
        | "LIVE"
        | "COMPLETED"
        | "CANCELLED"
        | "ARCHIVED",
      adminId: session.user.id
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.admin);

    return {
      success: `Updated match ${match.homeTeam} vs ${match.awayTeam}.`
    };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Unable to update match.") };
  }
}

export async function updateMarketStatusAction(
  marketId: string,
  _prevState: AdminMutationActionState,
  formData: FormData
): Promise<AdminMutationActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  try {
    const market = await updateMarketStatus({
      marketId,
      status: String(formData.get("status") ?? "") as "DRAFT" | "OPEN" | "CLOSED" | "VOID",
      adminId: session.user.id
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/markets/${market.id}`);
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.market(market.id));
    revalidateTag(cacheTags.admin);

    return {
      success:
        market.status === "VOID"
          ? `Market voided and ${market.refundedStakeCount} stake(s) refunded.`
          : `Market status updated to ${market.status}.`,
      meta: market.status === "VOID" ? { refundedStakeCount: market.refundedStakeCount } : undefined
    };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Unable to update market status.") };
  }
}

export async function manualTopUpAction(
  _prevState: AdminMutationActionState,
  formData: FormData
): Promise<AdminMutationActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  try {
    const result = await manualTopUp({
      userId: String(formData.get("userId") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      reason: String(formData.get("reason") ?? ""),
      adminId: session.user.id
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidateTag(cacheTags.admin);
    revalidateTag(cacheTags.dashboard(result.userId));

    return {
      success: `Added ${result.amount} coins to ${result.userLabel}.`
    };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Unable to top up wallet.") };
  }
}

export async function resolveRecoveryRequestAction(
  requestId: string,
  _prevState: AdminMutationActionState,
  formData: FormData
): Promise<AdminMutationActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  try {
    const user = await resolveRecoveryRequest({
      requestId,
      email: String(formData.get("email") ?? ""),
      adminId: session.user.id
    });

    revalidatePath("/admin");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidateTag(cacheTags.admin);
    revalidateTag(cacheTags.dashboard(user.id));

    return {
      success: `Recovery request resolved for ${user.email}.`
    };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Unable to resolve recovery request.") };
  }
}
