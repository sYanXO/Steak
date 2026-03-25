type TimingMeta = Record<string, string | number | boolean | undefined>;
type LogMeta = Record<string, string | number | boolean | undefined | null>;

export function getErrorMessage(error: unknown, fallback = "unknown-error") {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

export function logEvent(name: string, meta: LogMeta = {}) {
  console.info(
    JSON.stringify({
      type: "event",
      name,
      ...meta
    })
  );
}

export function logActionStart(name: string, meta: LogMeta = {}) {
  logEvent(name, {
    phase: "start",
    ...meta
  });
}

export function logActionSuccess(name: string, meta: LogMeta = {}) {
  logEvent(name, {
    phase: "success",
    ...meta
  });
}

export function logActionError(name: string, error: unknown, meta: LogMeta = {}) {
  logEvent(name, {
    phase: "error",
    message: getErrorMessage(error),
    ...meta
  });
}

export async function measureAsync<T>(
  name: string,
  run: () => Promise<T>,
  meta: TimingMeta = {}
) {
  const start = performance.now();

  try {
    const result = await run();
    logTiming(name, performance.now() - start, "ok", meta);
    return result;
  } catch (error) {
    logTiming(name, performance.now() - start, "error", {
      ...meta,
      message: getErrorMessage(error)
    });
    throw error;
  }
}

function logTiming(
  name: string,
  durationMs: number,
  status: "ok" | "error",
  meta: TimingMeta
) {
  console.info(
    JSON.stringify({
      type: "timing",
      name,
      status,
      durationMs: Number(durationMs.toFixed(1)),
      ...meta
    })
  );
}
