"use client";

import { useActionState, useEffect, useRef } from "react";
import { manualTopUpAction, type AdminMutationActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminMutationActionState = {};

type ManualTopUpFormProps = {
  users: Array<{
    id: string;
    label: string;
  }>;
};

export function ManualTopUpForm({ users }: ManualTopUpFormProps) {
  const [state, formAction, pending] = useActionState(manualTopUpAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        User
        <select
          required
          name="userId"
          defaultValue=""
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        >
          <option value="" disabled>
            Select user
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Amount
        <input
          required
          type="number"
          name="amount"
          min={1}
          step={1}
          defaultValue={100}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        />
      </label>
      <label className="block text-sm font-medium">
        Reason
        <input
          required
          type="text"
          name="reason"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Support correction"
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

      <Button type="submit" className="w-full" disabled={pending || users.length === 0}>
        {pending ? "Applying top-up..." : "Apply top-up"}
      </Button>
    </form>
  );
}
