import { ZodError } from "zod";
import { cacheTags } from "@/lib/cache-tags";
import { getErrorMessage } from "@/lib/observability";
import { actionRequestIdSchema } from "@/lib/validation/admin";

export type SettleMarketActionState = {
  error?: string;
  success?: string;
};

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return getErrorMessage(error, fallback);
}

function getRequestId(formData: FormData) {
  return actionRequestIdSchema.parse(String(formData.get("requestId") ?? ""));
}

type SettleMarketActionDeps = {
  auth: () => Promise<{
    user?: {
      id: string;
      email?: string | null;
      role?: "USER" | "ADMIN";
    } | null;
  } | null>;
  settleMarket: (input: {
    marketId: string;
    outcomeId: string;
    adminId: string;
  }) => Promise<{
    settledStakeCount: number;
    settledOutcome: string;
  }>;
  revalidatePath: (path: string) => void;
  revalidateTag: (tag: string) => void;
  runIdempotent: <T>(key: string, run: () => Promise<T>) => Promise<T>;
  logActionStart: (name: string, meta?: Record<string, string | number | boolean | undefined | null>) => void;
  logActionSuccess: (name: string, meta?: Record<string, string | number | boolean | undefined | null>) => void;
  logActionError: (
    name: string,
    error: unknown,
    meta?: Record<string, string | number | boolean | undefined | null>
  ) => void;
};

export function createSettleMarketAction(deps: SettleMarketActionDeps) {
  return async function settleMarketAction(
    marketId: string,
    _prevState: SettleMarketActionState,
    formData: FormData
  ): Promise<SettleMarketActionState> {
    const session = await deps.auth();

    if (!session?.user?.email || session.user.role !== "ADMIN") {
      return { error: "Admin authorization required." };
    }

    const adminUser = session.user;

    deps.logActionStart("admin.settle-market", { adminId: adminUser.id, marketId });

    try {
      const requestId = getRequestId(formData);
      const result = await deps.runIdempotent(`settle:${adminUser.id}:${requestId}`, () =>
        deps.settleMarket({
          marketId,
          outcomeId: String(formData.get("outcomeId") ?? ""),
          adminId: adminUser.id
        })
      );

      deps.revalidatePath("/");
      deps.revalidatePath("/dashboard");
      deps.revalidatePath("/admin");
      deps.revalidatePath(`/markets/${marketId}`);
      deps.revalidateTag(cacheTags.homepage);
      deps.revalidateTag(cacheTags.market(marketId));
      deps.revalidateTag(cacheTags.admin);

      deps.logActionSuccess("admin.settle-market", {
        adminId: adminUser.id,
        marketId,
        settledStakeCount: result.settledStakeCount
      });

      return {
        success: `Settled ${result.settledStakeCount} stake(s) for ${result.settledOutcome}.`
      };
    } catch (error) {
      deps.logActionError("admin.settle-market", error, { adminId: adminUser.id, marketId });
      return { error: getActionErrorMessage(error, "Unable to settle market.") };
    }
  };
}
