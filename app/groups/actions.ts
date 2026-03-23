"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
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

  try {
    const group = await createGroup({
      userEmail: session.user.email,
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? "")
    });

    revalidatePath("/dashboard");
    revalidatePath("/groups");

    return {
      success: `Created group ${group.name}.`
    };
  } catch (error) {
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

  try {
    const group = await joinGroup({
      userEmail: session.user.email,
      slug: String(formData.get("slug") ?? "")
    });

    revalidatePath("/dashboard");
    revalidatePath("/groups");

    return {
      success: `Joined group ${group.name}.`
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Unable to join group." };
  }
}
