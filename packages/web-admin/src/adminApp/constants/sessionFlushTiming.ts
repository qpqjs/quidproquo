// The flush poll doubles as the coalescing window; retry backoff grows with the
// retry count up to the max.
export const sessionFlushTiming = {
  pollMs: 300,
  retryBaseMs: 500,
  retryMaxMs: 30_000,
};
