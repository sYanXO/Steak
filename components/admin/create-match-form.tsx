"use client";

import { useActionState } from "react";
import { createMatchAction, type AdminCreateActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminCreateActionState = {};

export function CreateMatchForm() {
  const [state, formAction, pending] = useActionState(createMatchAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Match title
        <input
          required
          type="text"
          name="title"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Mumbai Indians vs Chennai Super Kings"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Home team
          <input
            required
            type="text"
            name="homeTeam"
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
            placeholder="Mumbai Indians"
          />
        </label>
        <label className="block text-sm font-medium">
          Away team
          <input
            required
            type="text"
            name="awayTeam"
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
            placeholder="Chennai Super Kings"
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Match start time
        <input
          required
          type="datetime-local"
          name="startsAt"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        />
      </label>
      <FormFeedback state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating match..." : "Create match"}
      </Button>
    </form>
  );
}

function FormFeedback({ state }: { state: AdminCreateActionState }) {
  if (state.error) {
    return (
      <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-error-border)", background: "var(--alert-error-bg)", color: "var(--alert-error-text)" }}>
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-success-border)", background: "var(--alert-success-bg)", color: "var(--alert-success-text)" }}>
        {state.success}
      </p>
    );
  }

  return null;
}
