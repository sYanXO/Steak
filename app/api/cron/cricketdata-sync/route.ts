import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import {
  getErrorMessage,
  logActionError,
  logActionStart,
  logActionSuccess
} from "@/lib/observability";
import { runMarketAutomation } from "@/lib/services/market-automation";
import { syncCricketDataMatches } from "@/lib/services/provider-sync";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cronHeader = request.headers.get("x-cron-secret");

  return bearerToken === secret || cronHeader === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const apiKey = process.env.CRICKETDATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "CRICKETDATA_API_KEY is not configured." }, { status: 500 });
  }

  logActionStart("cron.cricketdata-sync");

  try {
    const syncSummary = await syncCricketDataMatches(apiKey);
    const automationSummary = await runMarketAutomation();

    revalidatePath("/");
    revalidatePath("/admin");
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.admin);

    logActionSuccess("cron.cricketdata-sync", {
      syncedMatchCount: syncSummary.syncedMatchCount,
      createdMatchCount: syncSummary.createdMatchCount,
      updatedMatchCount: syncSummary.updatedMatchCount,
      autoCreatedMarketCount: automationSummary.createdMarketCount,
      autoSettledMarketCount: automationSummary.settledMarketCount
    });

    return NextResponse.json({
      ok: true,
      syncSummary,
      automationSummary
    });
  } catch (error) {
    logActionError("cron.cricketdata-sync", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error, "Unable to sync CricketData matches.")
      },
      { status: 500 }
    );
  }
}
