type RateLimitWindow = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type LimiterConfig = {
  maxAttempts: number;
  windowMs: number;
};

const storage = new Map<string, RateLimitWindow>();

const limiterConfigs = {
  signUp: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000
  },
  signIn: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000
  },
  groupJoin: {
    maxAttempts: 8,
    windowMs: 10 * 60 * 1000
  }
} satisfies Record<string, LimiterConfig>;

function buildKey(scope: keyof typeof limiterConfigs, identity: string) {
  return `${scope}:${identity.trim().toLowerCase()}`;
}

function consumeAttempt(key: string, config: LimiterConfig, now = Date.now()): RateLimitResult {
  const current = storage.get(key);

  if (!current || current.resetAt <= now) {
    storage.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    });

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      retryAfterSeconds: 0
    };
  }

  if (current.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  storage.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(0, config.maxAttempts - current.count),
    retryAfterSeconds: 0
  };
}

function clearAttemptWindow(key: string) {
  storage.delete(key);
}

export function consumeSignUpAttempt(email: string) {
  return consumeAttempt(buildKey("signUp", email), limiterConfigs.signUp);
}

export function consumeSignInAttempt(email: string) {
  return consumeAttempt(buildKey("signIn", email), limiterConfigs.signIn);
}

export function resetSignInAttempts(email: string) {
  clearAttemptWindow(buildKey("signIn", email));
}

export function consumeGroupJoinAttempt(userEmail: string, slug: string) {
  return consumeAttempt(
    buildKey("groupJoin", `${userEmail}:${slug}`),
    limiterConfigs.groupJoin
  );
}

export function formatRetryMessage(action: string, retryAfterSeconds: number) {
  const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);

  return `Too many ${action} attempts. Try again in about ${retryAfterMinutes} minute(s).`;
}

export function resetAllRateLimits() {
  storage.clear();
}
