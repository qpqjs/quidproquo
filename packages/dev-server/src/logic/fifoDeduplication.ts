// Mirrors the SQS / SNS FIFO 5 minute deduplication window
const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000;

const seenDeduplicationExpiryTimes: Map<string, number> = new Map();

// Returns true when the key was already seen inside the dedup window; otherwise records
// it and returns false. Keys should be namespaced by resource, e.g. `${queueName}:${dedupId}`.
export const isDuplicateFifoMessage = (deduplicationKey: string): boolean => {
  const now = Date.now();

  for (const [key, expiryTime] of seenDeduplicationExpiryTimes) {
    if (expiryTime <= now) {
      seenDeduplicationExpiryTimes.delete(key);
    }
  }

  if (seenDeduplicationExpiryTimes.has(deduplicationKey)) {
    return true;
  }

  seenDeduplicationExpiryTimes.set(deduplicationKey, now + DEDUPLICATION_WINDOW_MS);
  return false;
};
