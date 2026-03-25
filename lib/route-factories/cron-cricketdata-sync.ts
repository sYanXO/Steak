import { NextResponse } from "next/server";
import { cacheTags } from "@/lib/cache-tags";
import { getErrorMessage } from "@/lib/observability";
import { isCronAuthorized } from "@/lib/cron-auth";

type SyncSummary = {
  syncedMatchCount: number;
  createdMatchCount: number;
  updatedMatchCount: number;
  prunedMatchCount: number;
};

type AutomationSummary = {
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
  getApiKey: () => string | undefined;
  syncCricketDataMatches: (apiKey: string) => Promise<SyncSummary>;
  runMarketAutomation: () => Promise<AutomationSummary>;
  revalidatePath: (path: string) => void;
  revalidateTag: (tag: string) => void;
  logActionStart: (name: string) => void;
  logActionSuccess: (
    name: string,
    meta: Record<string, string | number | boolean | null | undefined>
  ) => void;
  logActionError: (name: string, error: unknown) => void;
};

export function createCronCricketdataSyncRoute(deps: Deps) {
  return async function GET(request: Request) {
    if (!isCronAuthorized(request, deps.getSecret())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const apiKey = deps.getApiKey();

    if (!apiKey) {
      return NextResponse.json({ error: "CRICKETDATA_API_KEY is not configured." }, { status: 500 });
    }

    deps.logActionStart("cron.cricketdata-sync");

    try {
      const { searchParams } = new URL(request.url);
      const includeAutomation =
        searchParams.get("automation") === "1" || searchParams.get("automation") === "true";
      const syncSummary = await deps.syncCricketDataMatches(apiKey);
      const automationSummary = includeAutomation ? await deps.runMarketAutomation() : null;

      deps.revalidatePath("/");
      deps.revalidatePath("/admin");
      deps.revalidateTag(cacheTags.homepage);
      deps.revalidateTag(cacheTags.admin);

      deps.logActionSuccess("cron.cricketdata-sync", {
        syncedMatchCount: syncSummary.syncedMatchCount,
        createdMatchCount: syncSummary.createdMatchCount,
        updatedMatchCount: syncSummary.updatedMatchCount,
        prunedMatchCount: syncSummary.prunedMatchCount,
        automationIncluded: includeAutomation,
        autoCreatedMarketCount: automationSummary?.createdMarketCount ?? 0,
        autoSettledMarketCount: automationSummary?.settledMarketCount ?? 0
      });

      return NextResponse.json({
        ok: true,
        syncSummary,
        automationSummary
      });
    } catch (error) {
      deps.logActionError("cron.cricketdata-sync", error);

      return NextResponse.json(
        {
          error: getErrorMessage(error, "Unable to sync CricketData matches.")
        },
        { status: 500 }
      );
    }
  };
}
