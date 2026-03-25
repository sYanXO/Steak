"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { cacheTags } from "@/lib/cache-tags";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { placeStake } from "@/lib/services/place-stake";

export type PlaceStakeActionState = {
  error?: string;
  success?: string;
};

type StakeActionSession = {
  user?: {
    id: string;
    email?: string | null;
  } | null;
} | null;

type PlaceStakeActionDeps = {
  auth: () => Promise<StakeActionSession>;
  placeStake: typeof placeStake;
  revalidatePath: typeof revalidatePath;
  revalidateTag: typeof revalidateTag;
  logActionStart: typeof logActionStart;
  logActionSuccess: typeof logActionSuccess;
  logActionError: typeof logActionError;
};

export function createPlaceStakeAction(deps: PlaceStakeActionDeps) {
  return async function placeStakeAction(
    marketId: string,
    _prevState: PlaceStakeActionState,
    formData: FormData
  ): Promise<PlaceStakeActionState> {
    const session = await deps.auth();

    if (!session?.user?.email) {
      return { error: "Sign in before placing a stake." };
    }

    deps.logActionStart("markets.place-stake", {
      marketId,
      userId: session.user.id
    });

    try {
      const result = await deps.placeStake({
        marketId,
        outcomeId: String(formData.get("outcomeId") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
        userEmail: session.user.email
      });

      deps.revalidatePath("/");
      deps.revalidatePath("/dashboard");
      deps.revalidatePath(`/markets/${marketId}`);
      deps.revalidateTag(cacheTags.homepage);
      deps.revalidateTag(cacheTags.market(marketId));
      deps.revalidateTag(cacheTags.dashboard(session.user.id));

      deps.logActionSuccess("markets.place-stake", {
        marketId,
        userId: session.user.id,
        stakeId: result.stakeId,
        amount: Number(formData.get("amount") ?? 0)
      });

      return {
        success: `Stake placed at ${result.quotedOdds.toFixed(2)}x odds.`
      };
    } catch (error) {
      deps.logActionError("markets.place-stake", error, {
        marketId,
        userId: session.user.id
      });
      if (error instanceof Error) {
        return { error: error.message };
      }

      return { error: "Unable to place stake." };
    }
  };
}

export const placeStakeAction = createPlaceStakeAction({
  auth,
  placeStake,
  revalidatePath,
  revalidateTag,
  logActionStart,
  logActionSuccess,
  logActionError
});
