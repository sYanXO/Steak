"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createRunMarketAutomationAction,
  createRunProviderSyncAction
} from "@/lib/action-factories/admin-automation";
import { createSettleMarketAction } from "@/lib/action-factories/settle-market";
import { cacheTags } from "@/lib/cache-tags";
import { runIdempotent } from "@/lib/idempotency";
import {
  getErrorMessage,
  logActionError,
  logActionStart,
  logActionSuccess
} from "@/lib/observability";
import {
  createMarket,
  createMatch,
  manualTopUp,
  updateMatch,
  updateMarketStatus
} from "@/lib/services/admin-operations";
import { runMarketAutomation } from "@/lib/services/market-automation";
import { resolveRecoveryRequest } from "@/lib/services/profile";
import { syncCricketDataMatches } from "@/lib/services/provider-sync";
import { actionRequestIdSchema } from "@/lib/validation/admin";
import { settleMarket } from "@/lib/services/settle-market";

export type { SettleMarketActionState } from "@/lib/action-factories/settle-market";

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

  return getErrorMessage(error, fallback);
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

function getRequestId(formData: FormData) {
  return actionRequestIdSchema.parse(String(formData.get("requestId") ?? ""));
}

const settleMarketActionImpl = createSettleMarketAction({
  auth,
  settleMarket,
  revalidatePath,
  revalidateTag,
  runIdempotent,
  logActionStart,
  logActionSuccess,
  logActionError
});

export async function settleMarketAction(
  ...args: Parameters<typeof settleMarketActionImpl>
): Promise<Awaited<ReturnType<typeof settleMarketActionImpl>>> {
  return settleMarketActionImpl(...args);
}

export async function createMatchAction(
  _prevState: AdminCreateActionState,
  formData: FormData
): Promise<AdminCreateActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  logActionStart("admin.create-match", { adminId: session.user.id });

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

    logActionSuccess("admin.create-match", {
      adminId: session.user.id,
      matchId: match.id
    });

    return {
      success: `Created match ${match.homeTeam} vs ${match.awayTeam}.`
    };
  } catch (error) {
    logActionError("admin.create-match", error, { adminId: session.user.id });
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

  logActionStart("admin.create-market", { adminId: session.user.id });

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

    logActionSuccess("admin.create-market", {
      adminId: session.user.id,
      marketId: market.id
    });

    return {
      success: `Created market ${market.title}.`
    };
  } catch (error) {
    logActionError("admin.create-market", error, { adminId: session.user.id });
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

  logActionStart("admin.update-match", { adminId: session.user.id, matchId });

  try {
    const match = await updateMatch({
      matchId,
      title: String(formData.get("title") ?? ""),
      homeTeam: String(formData.get("homeTeam") ?? ""),
      awayTeam: String(formData.get("awayTeam") ?? ""),
      startsAt: normalizeDateTimeLocal(formData.get("startsAt")),
      tossWinner: String(formData.get("tossWinner") ?? ""),
      tossDecision: String(formData.get("tossDecision") ?? ""),
      winnerTeam: String(formData.get("winnerTeam") ?? ""),
      completedAt: normalizeDateTimeLocal(formData.get("completedAt")),
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

    logActionSuccess("admin.update-match", {
      adminId: session.user.id,
      matchId: match.id,
      status: match.status
    });

    return {
      success: `Updated match ${match.homeTeam} vs ${match.awayTeam}.`
    };
  } catch (error) {
    logActionError("admin.update-match", error, { adminId: session.user.id, matchId });
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

  logActionStart("admin.update-market-status", { adminId: session.user.id, marketId });

  try {
    const requestId = getRequestId(formData);
    const market = await runIdempotent(`market-status:${session.user.id}:${requestId}`, () =>
      updateMarketStatus({
        marketId,
        status: String(formData.get("status") ?? "") as "DRAFT" | "OPEN" | "CLOSED" | "VOID",
        adminId: session.user.id
      })
    );

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/markets/${market.id}`);
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.market(market.id));
    revalidateTag(cacheTags.admin);

    logActionSuccess("admin.update-market-status", {
      adminId: session.user.id,
      marketId: market.id,
      status: market.status,
      refundedStakeCount: market.refundedStakeCount
    });

    return {
      success:
        market.status === "VOID"
          ? `Market voided and ${market.refundedStakeCount} stake(s) refunded.`
          : `Market status updated to ${market.status}.`,
      meta: market.status === "VOID" ? { refundedStakeCount: market.refundedStakeCount } : undefined
    };
  } catch (error) {
    logActionError("admin.update-market-status", error, {
      adminId: session.user.id,
      marketId
    });
    return { error: getActionErrorMessage(error, "Unable to update market status.") };
  }
}

const runProviderSyncActionImpl = createRunProviderSyncAction({
  auth,
  getApiKey: () => process.env.CRICKETDATA_API_KEY,
  syncCricketDataMatches,
  revalidatePath,
  revalidateTag,
  logActionStart,
  logActionSuccess,
  logActionError
});

export async function runProviderSyncAction(
  ...args: Parameters<typeof runProviderSyncActionImpl>
): Promise<Awaited<ReturnType<typeof runProviderSyncActionImpl>>> {
  return runProviderSyncActionImpl(...args);
}

const runMarketAutomationActionImpl = createRunMarketAutomationAction({
  auth,
  runMarketAutomation,
  revalidatePath,
  revalidateTag,
  logActionStart,
  logActionSuccess,
  logActionError
});

export async function runMarketAutomationAction(
  ...args: Parameters<typeof runMarketAutomationActionImpl>
): Promise<Awaited<ReturnType<typeof runMarketAutomationActionImpl>>> {
  return runMarketAutomationActionImpl(...args);
}

export async function manualTopUpAction(
  _prevState: AdminMutationActionState,
  formData: FormData
): Promise<AdminMutationActionState> {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { error: "Admin authorization required." };
  }

  logActionStart("admin.manual-top-up", { adminId: session.user.id });

  try {
    const requestId = getRequestId(formData);
    const result = await runIdempotent(`top-up:${session.user.id}:${requestId}`, () =>
      manualTopUp({
        userId: String(formData.get("userId") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
        reason: String(formData.get("reason") ?? ""),
        adminId: session.user.id
      })
    );

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidateTag(cacheTags.admin);
    revalidateTag(cacheTags.dashboard(result.userId));

    logActionSuccess("admin.manual-top-up", {
      adminId: session.user.id,
      userId: result.userId,
      amount: result.amount
    });

    return {
      success: `Added ${result.amount} coins to ${result.userLabel}.`
    };
  } catch (error) {
    logActionError("admin.manual-top-up", error, { adminId: session.user.id });
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

  logActionStart("admin.resolve-recovery-request", { adminId: session.user.id, requestId });

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

    logActionSuccess("admin.resolve-recovery-request", {
      adminId: session.user.id,
      requestId,
      userId: user.id
    });

    return {
      success: `Recovery request resolved for ${user.email}.`
    };
  } catch (error) {
    logActionError("admin.resolve-recovery-request", error, {
      adminId: session.user.id,
      requestId
    });
    return { error: getActionErrorMessage(error, "Unable to resolve recovery request.") };
  }
}
