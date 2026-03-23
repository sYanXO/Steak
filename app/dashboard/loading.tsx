import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <Card className="rounded-[32px] p-6 md:p-8">
          <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)]"
              />
            ))}
          </div>
        </Card>
        <Card className="rounded-[32px] p-6">
          <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)]"
              />
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
