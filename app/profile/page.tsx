import { AdminProfileForm } from "@/components/profile/admin-profile-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecoveryRequestForm } from "@/components/profile/recovery-request-form";
import { Card } from "@/components/ui/card";
import { formatUtcDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastEmailChangeAt: true,
      lastPasswordChangeAt: true,
      recoveryRequests: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          requestedEmail: true,
          status: true,
          createdAt: true
        }
      }
    }
  });

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.95fr]">
        <Card className="rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">My profile</p>
          <h1 className="mt-2 text-3xl font-bold">
            {user.name ? `${user.name}, this is your account center.` : "Your account center"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Manage identity details, understand credential policies, and request support for account recovery.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard label="Display name" value={user.name ?? "Not set"} />
            <InfoCard label="Attached email" value={user.email} />
            <InfoCard label="Role" value={user.role} />
            <InfoCard label="Joined" value={formatUtcDateTime(user.createdAt)} />
          </div>
        </Card>

        <Card className="rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Credential policy
          </p>
          <div className="mt-4 space-y-4">
            <PolicyItem
              title="Email change cadence"
              detail="Self-service email changes are temporarily under development and are not available in this release."
            />
            <PolicyItem
              title="Password change cadence"
              detail="Self-service password changes are temporarily under development and are not available in this release."
            />
            <PolicyItem
              title="Verification requirement"
              detail="For now, use the admin request flow below if you need account help or an email correction."
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {user.role === "ADMIN" ? (
          <Card className="rounded-[32px] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Admin identity</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Admins can update their own name and email directly without OTP verification. If you change the email, sign out and sign back in afterward.
            </p>
            <div className="mt-5">
              <AdminProfileForm
                defaultName={user.name ?? "Admin"}
                defaultEmail={user.email}
              />
            </div>
          </Card>
        ) : null}

        <Card className="rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Change email</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            This feature is under development. Please use the admin request feature below for any email correction needs right now.
          </p>
          <UnderDevelopmentNotice />
        </Card>

        <Card className="rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Change password</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            This feature is under development. Please use the admin request feature below if you need help regaining access for now.
          </p>
          <UnderDevelopmentNotice />
        </Card>

        <Card className="rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Credential updates</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            OTP-based self-service verification is paused for now. Once this feature is released, it will appear here.
          </p>
          <UnderDevelopmentNotice />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <Card className="rounded-[32px] p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                Recovery and support
              </p>
              <h2 className="mt-2 text-2xl font-bold">Request an admin-led email correction</h2>
            </div>
            <Link href="/dashboard" className="text-sm font-semibold text-[var(--accent-dark)]">
              Back to dashboard
            </Link>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            If you lost access or your attached email needs correction, submit a personalised report here. An admin can review and resolve it manually.
          </p>
          <div className="mt-5">
            <RecoveryRequestForm />
          </div>
        </Card>

        <Card className="rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Recent requests</p>
          <div className="mt-4 space-y-3">
            {user.recoveryRequests.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No recovery requests submitted yet.</p>
            ) : (
              user.recoveryRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4"
                >
                  <p className="font-medium">{request.requestedEmail}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Submitted {formatUtcDateTime(request.createdAt)}
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                    {request.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function PolicyItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function UnderDevelopmentNotice() {
  return (
    <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
      <p className="font-medium">Under development</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        This self-service flow is currently disabled. Use the admin request feature below until it is released.
      </p>
    </div>
  );
}
