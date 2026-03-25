import assert from "node:assert/strict";
import test from "node:test";
import { fetchCricketDataMatches } from "@/lib/providers/cricketdata";

test("fetchCricketDataMatches only returns IPL matches from the free provider feed", async () => {
  const originalFetch = global.fetch;

  global.fetch = (async () =>
    ({
      ok: true,
      async json() {
        return {
          data: [
            {
              id: "ipl-1",
              name: "IPL 2026: Mumbai Indians vs Chennai Super Kings",
              status: "Match not started",
              dateTimeGMT: "2026-04-01T14:00:00.000Z",
              teams: ["Mumbai Indians", "Chennai Super Kings"]
            },
            {
              id: "test-1",
              name: "England vs Australia",
              series: "The Ashes",
              status: "Match not started",
              dateTimeGMT: "2026-04-01T14:00:00.000Z",
              teams: ["England", "Australia"]
            }
          ]
        };
      }
    }) as Response) as typeof fetch;

  try {
    const matches = await fetchCricketDataMatches("api-key");

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.providerMatchId, "ipl-1");
    assert.equal(matches[0]?.homeTeam, "Mumbai Indians");
  } finally {
    global.fetch = originalFetch;
  }
});
