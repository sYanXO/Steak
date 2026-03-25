"use client";

import { useActionState } from "react";
import { updateMatchAction, type AdminMutationActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminMutationActionState = {};

type UpdateMatchFormProps = {
  match: {
    id: string;
    title: string;
    homeTeam: string;
    awayTeam: string;
    startsAtLocalValue: string;
    status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  };
};

const matchStatuses = ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"] as const;

export function UpdateMatchForm({ match }: UpdateMatchFormProps) {
  const action = updateMatchAction.bind(null, match.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <label className="block text-sm font-medium">
        Match title
        <input
          required
          type="text"
          name="title"
          defaultValue={match.title}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Home team
          <input
            required
            type="text"
            name="homeTeam"
            defaultValue={match.homeTeam}
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          />
        </label>
        <label className="block text-sm font-medium">
          Away team
          <input
            required
            type="text"
            name="awayTeam"
            defaultValue={match.awayTeam}
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <label className="block text-sm font-medium">
          Match start time
          <input
            required
            type="datetime-local"
            name="startsAt"
            defaultValue={match.startsAtLocalValue}
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          />
        </label>

        <label className="block text-sm font-medium">
          Match status
          <select
            name="status"
            defaultValue={match.status}
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          >
            {matchStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-error-border)", background: "var(--alert-error-bg)", color: "var(--alert-error-text)" }}>
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-success-border)", background: "var(--alert-success-bg)", color: "var(--alert-success-text)" }}>
          {state.success}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating match..." : "Update match"}
      </Button>
    </form>
  );
}
