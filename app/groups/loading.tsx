import { Card } from "@/components/ui/card";

export default function GroupsLoading() {
  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="rounded-[32px] p-6 md:p-8">
            <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--panel-strong)]" />
            <div className="mt-4 h-10 w-64 animate-pulse rounded-full bg-[var(--panel-strong)]" />
            <div className="mt-5 h-40 animate-pulse rounded-[24px] bg-[var(--surface-soft)]" />
          </Card>
        ))}
      </div>
    </main>
  );
}
