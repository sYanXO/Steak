import { Card } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <main className="app-shell py-8">
      <Card className="rounded-[32px] p-6 md:p-8">
        <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--panel-strong)]" />
        <div className="mt-4 h-10 w-80 animate-pulse rounded-full bg-[var(--panel-strong)]" />
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[32px] p-6 lg:col-span-2">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)]"
              />
            ))}
          </div>
        </Card>
        <Card className="rounded-[32px] p-6">
          <div className="h-40 animate-pulse rounded-[24px] bg-[var(--surface-soft)]" />
        </Card>
      </div>
    </main>
  );
}
