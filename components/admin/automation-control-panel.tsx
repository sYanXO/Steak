"use client";

import { useActionState } from "react";
import {
  runMarketAutomationAction,
  runProviderSyncAction,
  type AdminMutationActionState
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminMutationActionState = {};

export function AutomationControlPanel() {
  const [syncState, syncAction, syncPending] = useActionState(
    runProviderSyncAction,
    initialState
  );
  const [automationState, automationAction, automationPending] = useActionState(
    runMarketAutomationAction,
    initialState
  );

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <form action={syncAction} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Provider sync</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Pull the latest fixtures and results from CricketData without waiting for cron.
        </p>
        <div className="mt-4">
          <Button type="submit" className="w-full" disabled={syncPending}>
            {syncPending ? "Syncing matches..." : "Run provider sync"}
          </Button>
        </div>
        <ActionFeedback state={syncState} />
      </form>

      <form action={automationAction} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Market automation</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Create standard markets, open or close them by time, and settle eligible results immediately.
        </p>
        <div className="mt-4">
          <Button type="submit" className="w-full" disabled={automationPending}>
            {automationPending ? "Running automation..." : "Run market automation"}
          </Button>
        </div>
        <ActionFeedback state={automationState} />
      </form>
    </div>
  );
}

function ActionFeedback({ state }: { state: AdminMutationActionState }) {
  if (state.error) {
    return (
      <p
        className="mt-4 rounded-2xl border px-4 py-3 text-sm"
        style={{
          borderColor: "var(--alert-error-border)",
          background: "var(--alert-error-bg)",
          color: "var(--alert-error-text)"
        }}
      >
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p
        className="mt-4 rounded-2xl border px-4 py-3 text-sm"
        style={{
          borderColor: "var(--alert-success-border)",
          background: "var(--alert-success-bg)",
          color: "var(--alert-success-text)"
        }}
      >
        {state.success}
      </p>
    );
  }

  return null;
}
