import { cacheTags } from "@/lib/cache-tags";

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

type PlaceStakeResult = {
  stakeId: string;
  quotedOdds: number;
};

type PlaceStakeActionDeps = {
  auth: () => Promise<StakeActionSession>;
  placeStake: (input: {
    marketId: string;
    outcomeId: string;
    amount: number;
    userEmail: string;
  }) => Promise<PlaceStakeResult>;
  revalidatePath: (path: string) => void;
  revalidateTag: (tag: string) => void;
  logActionStart: (name: string, meta?: Record<string, string | number | boolean | undefined | null>) => void;
  logActionSuccess: (name: string, meta?: Record<string, string | number | boolean | undefined | null>) => void;
  logActionError: (
    name: string,
    error: unknown,
    meta?: Record<string, string | number | boolean | undefined | null>
  ) => void;
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
      const amount = Number(formData.get("amount") ?? 0);
      const result = await deps.placeStake({
        marketId,
        outcomeId: String(formData.get("outcomeId") ?? ""),
        amount,
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
        amount
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
