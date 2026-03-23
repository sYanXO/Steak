import { Card } from "@/components/ui/card";

export default function MarketLoading() {
  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <Card className="rounded-[32px] p-6 md:p-8">
          <div className="h-4 w-36 animate-pulse rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)]"
              />
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="rounded-[32px] p-6">
              <div className="h-44 animate-pulse rounded-[24px] bg-[var(--surface-soft)]" />
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
