"use client";

import { useActionState } from "react";
import { createMarketAction, type AdminCreateActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminCreateActionState = {};

type CreateMarketFormProps = {
  matches: Array<{
    id: string;
    label: string;
  }>;
};

export function CreateMarketForm({ matches }: CreateMarketFormProps) {
  const [state, formAction, pending] = useActionState(createMarketAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Match
        <select
          required
          name="matchId"
          defaultValue={matches[0]?.id ?? ""}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        >
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-[var(--muted)]">
          Match start labels are shown in IST. The market close time must be earlier than the selected match start.
        </span>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Market title
          <input
            required
            type="text"
            name="title"
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
            placeholder="Match winner"
          />
        </label>
        <label className="block text-sm font-medium">
          Market type
          <input
            required
            type="text"
            name="type"
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
            placeholder="MATCH_WINNER"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Open time
          <input
            required
            type="datetime-local"
            name="opensAt"
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          />
        </label>
        <label className="block text-sm font-medium">
          Close time
          <input
            required
            type="datetime-local"
            name="closesAt"
            className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          />
        </label>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Match labels and validation messages are shown in IST.
      </p>
      <label className="block text-sm font-medium">
        Outcomes
        <textarea
          required
          name="outcomes"
          rows={3}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Mumbai Indians, Chennai Super Kings"
        />
      </label>
      <FormFeedback state={state} />
      <Button type="submit" className="w-full" disabled={pending || matches.length === 0}>
        {pending ? "Creating market..." : "Create market"}
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
