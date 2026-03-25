type TimingMeta = Record<string, string | number | boolean | undefined>;

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
      message: error instanceof Error ? error.message : "unknown-error"
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
