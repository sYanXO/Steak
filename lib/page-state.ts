type SessionLike = {
  user?: {
    id?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
} | null;

type MarketLifecycleStatus = "DRAFT" | "OPEN" | "CLOSED" | "SETTLED" | "VOID";

export function getSignInRedirect(session: SessionLike) {
  return session?.user?.email ? null : "/sign-in";
}

export function getAdminRedirect(session: SessionLike) {
  if (!session?.user) {
    return "/sign-in";
  }

  return session.user.role === "ADMIN" ? null : "/dashboard";
}

export function getUserByIdRedirect(session: SessionLike) {
  return session?.user?.id ? null : "/sign-in";
}

export function isMarketUnavailable(status: MarketLifecycleStatus) {
  return status === "VOID" || status === "SETTLED";
}

export function getMarketUnavailableMessage(status: MarketLifecycleStatus) {
  if (status === "VOID") {
    return "This market is voided and no further stakes can be placed.";
  }

  if (status === "SETTLED") {
    return "This market has already been finalized.";
  }

  return null;
}
