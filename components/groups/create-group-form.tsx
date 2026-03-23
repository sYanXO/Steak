"use client";

import { useActionState } from "react";
import { createGroupAction, type GroupActionState } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";

const initialState: GroupActionState = {};

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(createGroupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Group name
        <input
          required
          type="text"
          name="name"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Night Watch League"
        />
      </label>
      <label className="block text-sm font-medium">
        Group slug
        <input
          required
          type="text"
          name="slug"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="night-watch-league"
        />
      </label>
      <Feedback state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating group..." : "Create group"}
      </Button>
    </form>
  );
}

function Feedback({ state }: { state: GroupActionState }) {
  if (state.error) {
    return <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-error-border)", background: "var(--alert-error-bg)", color: "var(--alert-error-text)" }}>{state.error}</p>;
  }

  if (state.success) {
    return <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-success-border)", background: "var(--alert-success-bg)", color: "var(--alert-success-text)" }}>{state.success}</p>;
  }

  return null;
}
