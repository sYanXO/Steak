import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { JoinGroupForm } from "@/components/groups/join-group-form";
import { Card } from "@/components/ui/card";
import { formatCoins } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      memberships: {
        select: {
          group: {
            select: {
              id: true,
              slug: true,
              name: true,
              members: {
                select: { id: true }
              },
              leaderboard: {
                where: { scope: "GROUP" },
                orderBy: { rank: "asc" },
                take: 5,
                select: {
                  id: true,
                  rank: true,
                  balance: true,
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Create group</p>
          <h1 className="mt-2 text-3xl font-bold">Start a private leaderboard</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Group standings mirror member wallet balances and update whenever balances change.
          </p>
          <div className="mt-5">
            <CreateGroupForm />
          </div>
        </Card>

        <Card className="rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Join group</p>
          <h2 className="mt-2 text-3xl font-bold">Enter by slug</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Join an existing private competition with its shared slug.
          </p>
          <div className="mt-5">
            <JoinGroupForm />
          </div>
        </Card>
      </div>

      <div className="mt-6 space-y-6">
        {user.memberships.length === 0 ? (
          <Card className="rounded-[32px] p-6 md:p-8">
            <p className="text-sm text-[var(--muted)]">
              You have not joined any groups yet.
            </p>
          </Card>
        ) : (
          user.memberships.map((membership) => (
            <Card key={membership.group.id} className="rounded-[32px] p-6 md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                    {membership.group.slug}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{membership.group.name}</h2>
                </div>
                <div className="rounded-full bg-[var(--panel-strong)] px-4 py-2 text-sm font-medium">
                  {membership.group.members.length} members
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line)]">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[var(--panel-strong)] text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membership.group.leaderboard.map((entry) => (
                      <tr key={entry.id} className="border-t border-[var(--line)] bg-[var(--surface-strong)]">
                        <td className="px-4 py-3">#{entry.rank ?? "-"}</td>
                        <td className="px-4 py-3 font-medium">
                          {entry.user.id === user.id
                            ? "You"
                            : entry.user.name ?? entry.user.email ?? "Player"}
                        </td>
                        <td className="px-4 py-3">{formatCoins(entry.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
