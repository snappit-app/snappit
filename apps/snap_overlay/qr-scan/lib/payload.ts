type PayloadEntry = { value: string; timestamp: number };

export interface RecentPayloadCache {
  isRecent(payload: string, now: number): boolean;
  remember(payload: string, now: number): void;
  prune(now: number): void;
  reset(): void;
}

export function createRecentPayloadCache(ttlMs: number, maxSize: number): RecentPayloadCache {
  const recent: PayloadEntry[] = [];

  const prune = (now: number) => {
    const cutoff = now - ttlMs;
    while (recent.length && recent[0]!.timestamp < cutoff) {
      recent.shift();
    }
    if (recent.length > maxSize) {
      recent.splice(0, recent.length - maxSize);
    }
  };

  const isRecent = (payload: string, now: number) => {
    prune(now);
    return recent.some((entry) => entry.value === payload);
  };

  const remember = (payload: string, now: number) => {
    recent.push({ value: payload, timestamp: now });
    prune(now);
  };

  const reset = () => {
    recent.splice(0);
  };

  return { isRecent, remember, prune, reset };
}
