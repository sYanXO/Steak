import { revalidatePath, revalidateTag } from "next/cache";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { createCronCricketdataSyncRoute } from "@/lib/route-factories/cron-cricketdata-sync";
import { runMarketAutomation } from "@/lib/services/market-automation";
import { syncCricketDataMatches } from "@/lib/services/provider-sync";

export const GET = createCronCricketdataSyncRoute({
  getSecret: () => process.env.CRON_SECRET,
  getApiKey: () => process.env.CRICKETDATA_API_KEY,
  syncCricketDataMatches,
  runMarketAutomation,
  revalidatePath,
  revalidateTag,
  logActionStart,
  logActionSuccess,
  logActionError
});
