import { revalidatePath, revalidateTag } from "next/cache";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { createCronMarketAutomationRoute } from "@/lib/route-factories/cron-market-automation";
import { runMarketAutomation } from "@/lib/services/market-automation";

export const GET = createCronMarketAutomationRoute({
  getSecret: () => process.env.CRON_SECRET,
  runMarketAutomation,
  revalidatePath,
  revalidateTag,
  logActionStart,
  logActionSuccess,
  logActionError
});
