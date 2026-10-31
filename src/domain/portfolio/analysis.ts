export type SampleEvent = {
  session: string;
  channel: 'outreach' | 'community' | 'direct';
  stage: 'started' | 'result' | 'exported';
  atMs: number;
};
export const channels = ['outreach', 'community', 'direct'] as const;

// Deliberately invented scenarios for analytical demonstration; never customer evidence.
export function sampleEvents(mode: 'a' | 'b'): SampleEvent[] {
  return Array.from({ length: 12 }, (_, i) => {
    const channel = channels[i % 3];
    const events: SampleEvent[] = [{ session: `sample-${i + 1}`, channel, stage: 'started', atMs: 0 }];
    if (i < 9) events.push({ session: `sample-${i + 1}`, channel, stage: 'result', atMs: 30_000 });
    if (i < (mode === 'a' ? 6 : 8))
      events.push({
        session: `sample-${i + 1}`,
        channel,
        stage: 'exported',
        atMs: (mode === 'a' ? 90_000 : 60_000) + i * 1000,
      });
    return events;
  }).flat();
}

export function summarize(events: readonly SampleEvent[]) {
  const sessions = new Map<string, SampleEvent[]>();
  for (const event of events) {
    if (!Number.isFinite(event.atMs) || event.atMs < 0) continue;
    const key = `${event.channel}/${event.session}`;
    sessions.set(key, [...(sessions.get(key) ?? []), event]);
  }
  let started = 0,
    results = 0,
    exported = 0;
  const durations: number[] = [];
  for (const rows of sessions.values()) {
    const start = rows.filter((e) => e.stage === 'started').sort((a, b) => a.atMs - b.atMs)[0];
    if (!start) continue;
    started++;
    const result = rows
      .filter((e) => e.stage === 'result' && e.atMs >= start.atMs)
      .sort((a, b) => a.atMs - b.atMs)[0];
    if (!result) continue;
    results++;
    const download = rows
      .filter((e) => e.stage === 'exported' && e.atMs >= result.atMs)
      .sort((a, b) => a.atMs - b.atMs)[0];
    if (download) {
      exported++;
      durations.push(download.atMs - start.atMs);
    }
  }
  durations.sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  const medianMs = durations.length
    ? durations.length % 2
      ? durations[mid]
      : (durations[mid - 1] + durations[mid]) / 2
    : null;
  return { started, results, exported, completion: started ? exported / started : null, medianMs };
}
