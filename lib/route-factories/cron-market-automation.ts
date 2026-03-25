import { NextResponse } from "next/server";
import { cacheTags } from "@/lib/cache-tags";
import { getErrorMessage } from "@/lib/observability";
import { isCronAuthorized } from "@/lib/cron-auth";

type MarketAutomationSummary = {
  createdMarketCount: number;
  openedMarketCount: number;
  closedMarketCount: number;
  settledMarketCount: number;
  liveMatchCount: number;
  completedMatchCount: number;
  createdMarketIds: string[];
  openedMarketIds: string[];
  closedMarketIds: string[];
  settledMarketIds: string[];
};

type Deps = {
  getSecret: () => string | undefined;
  runMarketAutomation: () => Promise<MarketAutomationSummary>;
  revalidatePath: (path: string) => void;
  revalidateTag: (tag: string) => void;
  logActionStart: (name: string) => void;
  logActionSuccess: (
    name: string,
    meta: Record<string, string | number | boolean | null | undefined>
  ) => void;
  logActionError: (name: string, error: unknown) => void;
};

export function createCronMarketAutomationRoute(deps: Deps) {
  return async function GET(request: Request) {
    if (!isCronAuthorized(request, deps.getSecret())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    deps.logActionStart("cron.market-automation");

    try {
      const summary = await deps.runMarketAutomation();

      deps.revalidatePath("/");
      deps.revalidatePath("/admin");
      deps.revalidatePath("/dashboard");
      deps.revalidateTag(cacheTags.homepage);
      deps.revalidateTag(cacheTags.admin);

      for (const marketId of new Set([
        ...summary.createdMarketIds,
        ...summary.openedMarketIds,
        ...summary.closedMarketIds,
        ...summary.settledMarketIds
      ])) {
        deps.revalidatePath(`/markets/${marketId}`);
        deps.revalidateTag(cacheTags.market(marketId));
      }

      deps.logActionSuccess("cron.market-automation", {
        createdMarketCount: summary.createdMarketCount,
        openedMarketCount: summary.openedMarketCount,
        closedMarketCount: summary.closedMarketCount,
        settledMarketCount: summary.settledMarketCount,
        liveMatchCount: summary.liveMatchCount,
        completedMatchCount: summary.completedMatchCount
      });

      return NextResponse.json({
        ok: true,
        summary
      });
    } catch (error) {
      deps.logActionError("cron.market-automation", error);

      return NextResponse.json(
        {
          error: getErrorMessage(error, "Unable to run market automation.")
        },
        { status: 500 }
      );
    }
  };
}
