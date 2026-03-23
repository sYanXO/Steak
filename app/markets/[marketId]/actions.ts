"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { placeStake } from "@/lib/services/place-stake";

export type PlaceStakeActionState = {
  error?: string;
  success?: string;
};

export async function placeStakeAction(
  marketId: string,
  _prevState: PlaceStakeActionState,
  formData: FormData
): Promise<PlaceStakeActionState> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Sign in before placing a stake." };
  }

  try {
    const result = await placeStake({
      marketId,
      outcomeId: String(formData.get("outcomeId") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      userEmail: session.user.email
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/markets/${marketId}`);

    return {
      success: `Stake placed at ${result.quotedOdds.toFixed(2)}x odds.`
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to place stake." };
  }
}
