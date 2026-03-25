import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { getErrorMessage, logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { runMarketAutomation } from "@/lib/services/market-automation";

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

  logActionStart("cron.market-automation");

  try {
    const summary = await runMarketAutomation();

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidateTag(cacheTags.homepage);
    revalidateTag(cacheTags.admin);

    for (const marketId of new Set([
      ...summary.createdMarketIds,
      ...summary.openedMarketIds,
      ...summary.closedMarketIds,
      ...summary.settledMarketIds
    ])) {
      revalidatePath(`/markets/${marketId}`);
      revalidateTag(cacheTags.market(marketId));
    }

    logActionSuccess("cron.market-automation", {
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
    logActionError("cron.market-automation", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error, "Unable to run market automation.")
      },
      { status: 500 }
    );
  }
}
