"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActionError, logActionStart, logActionSuccess } from "@/lib/observability";
import { consumeGroupJoinAttempt, formatRetryMessage } from "@/lib/rate-limit";
import { createGroup, joinGroup } from "@/lib/services/groups";

export type GroupActionState = {
  error?: string;
  success?: string;
};

export async function createGroupAction(
  _prevState: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Sign in before creating a group." };
  }

  logActionStart("groups.create", { userEmail: session.user.email.toLowerCase() });

  try {
    const group = await createGroup({
      userEmail: session.user.email,
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? "")
    });

    revalidatePath("/dashboard");
    revalidatePath("/groups");

    logActionSuccess("groups.create", {
      userEmail: session.user.email.toLowerCase(),
      groupId: group.id,
      slug: group.slug
    });

    return {
      success: `Created group ${group.name}.`
    };
  } catch (error) {
    logActionError("groups.create", error, { userEmail: session.user.email.toLowerCase() });
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to create group." };
  }
}

export async function joinGroupAction(
  _prevState: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Sign in before joining a group." };
  }

  const slug = String(formData.get("slug") ?? "");
  logActionStart("groups.join", {
    userEmail: session.user.email.toLowerCase(),
    slug: slug.trim().toLowerCase()
  });

  try {
    const rateLimit = consumeGroupJoinAttempt(session.user.email, slug);

    if (!rateLimit.allowed) {
      return { error: formatRetryMessage("group join", rateLimit.retryAfterSeconds) };
    }

    const group = await joinGroup({
      userEmail: session.user.email,
      slug
    });

    revalidatePath("/dashboard");
    revalidatePath("/groups");

    logActionSuccess("groups.join", {
      userEmail: session.user.email.toLowerCase(),
      groupId: group.id,
      slug: group.slug
    });

    return {
      success: `Joined group ${group.name}.`
    };
  } catch (error) {
    logActionError("groups.join", error, {
      userEmail: session.user.email.toLowerCase(),
      slug: slug.trim().toLowerCase()
    });
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to join group." };
  }
}
