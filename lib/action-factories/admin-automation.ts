import { cacheTags } from "@/lib/cache-tags";
import { getErrorMessage } from "@/lib/observability";

type SessionLike = {
  user?: {
    id: string;
    email?: string | null;
    role?: string | null;
  } | null;
} | null;

type AdminMutationActionState = {
  error?: string;
  success?: string;
  meta?: {
    refundedStakeCount?: number;
  };
};

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
  createdMarketIds: string[];
  openedMarketIds: string[];
  closedMarketIds: string[];
  settledMarketIds: string[];
};

type SharedDeps = {
  auth: () => Promise<SessionLike>;
  revalidatePath: (path: string) => void;
  revalidateTag: (tag: string) => void;
  logActionStart: (
    name: string,
    meta?: Record<string, string | number | boolean | null | undefined>
  ) => void;
  logActionSuccess: (
    name: string,
    meta?: Record<string, string | number | boolean | null | undefined>
  ) => void;
  logActionError: (
    name: string,
    error: unknown,
    meta?: Record<string, string | number | boolean | null | undefined>
  ) => void;
};

function requireAdminSession(session: SessionLike) {
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    throw new Error("Admin authorization required.");
  }

  return session.user;
}

export function createRunProviderSyncAction(
  deps: SharedDeps & {
    getApiKey: () => string | undefined;
    syncCricketDataMatches: (apiKey: string) => Promise<SyncSummary>;
  }
) {
  return async function runProviderSyncAction(
    _prevState: AdminMutationActionState
  ): Promise<AdminMutationActionState> {
    const session = await deps.auth();

    try {
      const adminUser = requireAdminSession(session);
      const apiKey = deps.getApiKey();

      if (!apiKey) {
        return { error: "CRICKETDATA_API_KEY is not configured." };
      }

      deps.logActionStart("admin.run-provider-sync", { adminId: adminUser.id });

      const summary = await deps.syncCricketDataMatches(apiKey);

      deps.revalidatePath("/");
      deps.revalidatePath("/admin");
      deps.revalidateTag(cacheTags.homepage);
      deps.revalidateTag(cacheTags.admin);

      deps.logActionSuccess("admin.run-provider-sync", {
        adminId: adminUser.id,
        syncedMatchCount: summary.syncedMatchCount,
        createdMatchCount: summary.createdMatchCount,
        updatedMatchCount: summary.updatedMatchCount,
        prunedMatchCount: summary.prunedMatchCount
      });

      return {
        success: `Synced ${summary.syncedMatchCount} provider match(es) and pruned ${summary.prunedMatchCount} stale match(es).`
      };
    } catch (error) {
      deps.logActionError("admin.run-provider-sync", error, {
        adminId: session?.user?.id ?? null
      });
      return { error: getErrorMessage(error, "Unable to run provider sync.") };
    }
  };
}

export function createRunMarketAutomationAction(
  deps: SharedDeps & {
    runMarketAutomation: () => Promise<AutomationSummary>;
  }
) {
  return async function runMarketAutomationAction(
    _prevState: AdminMutationActionState
  ): Promise<AdminMutationActionState> {
    const session = await deps.auth();

    try {
      const adminUser = requireAdminSession(session);

      deps.logActionStart("admin.run-market-automation", { adminId: adminUser.id });

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

      deps.logActionSuccess("admin.run-market-automation", {
        adminId: adminUser.id,
        createdMarketCount: summary.createdMarketCount,
        openedMarketCount: summary.openedMarketCount,
        closedMarketCount: summary.closedMarketCount,
        settledMarketCount: summary.settledMarketCount
      });

      return {
        success: `Automation ran. Created ${summary.createdMarketCount}, opened ${summary.openedMarketCount}, closed ${summary.closedMarketCount}, settled ${summary.settledMarketCount}.`
      };
    } catch (error) {
      deps.logActionError("admin.run-market-automation", error, {
        adminId: session?.user?.id ?? null
      });
      return { error: getErrorMessage(error, "Unable to run market automation.") };
    }
  };
}
