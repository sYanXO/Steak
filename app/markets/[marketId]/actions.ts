"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { createPlaceStakeAction } from "@/lib/action-factories/place-stake";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { placeStake } from "@/lib/services/place-stake";

export type { PlaceStakeActionState } from "@/lib/action-factories/place-stake";

export const placeStakeAction = createPlaceStakeAction({
  auth,
  placeStake,
  revalidatePath,
  revalidateTag,
  logActionStart,
  logActionSuccess,
  logActionError
});
