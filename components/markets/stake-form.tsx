"use client";

import { useActionState } from "react";
import { placeStakeAction, type PlaceStakeActionState } from "@/app/markets/[marketId]/actions";
import { Button } from "@/components/ui/button";

const initialState: PlaceStakeActionState = {};

type StakeFormProps = {
  marketId: string;
  outcomes: Array<{
    id: string;
    label: string;
    odds: string;
    totalStaked: string;
  }>;
};

export function StakeForm({ marketId, outcomes }: StakeFormProps) {
  const action = placeStakeAction.bind(null, marketId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Select outcome
        </legend>
        {outcomes.map((outcome, index) => (
          <label
            key={outcome.id}
            className="flex cursor-pointer items-center justify-between rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
          >
            <div>
              <p className="font-medium">{outcome.label}</p>
              <p className="text-sm text-[var(--muted)]">{outcome.totalStaked} staked</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{outcome.odds}</span>
              <input
                type="radio"
                name="outcomeId"
                value={outcome.id}
                defaultChecked={index === 0}
                className="size-4"
              />
            </div>
          </label>
        ))}
      </fieldset>

      <label className="block text-sm font-medium">
        Stake amount
        <input
          required
          type="number"
          name="amount"
          min={10}
          step={1}
          defaultValue={100}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        />
      </label>

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
        {pending ? "Placing stake..." : "Place stake"}
      </Button>
    </form>
  );
}
