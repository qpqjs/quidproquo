/** Resolves after `ms` milliseconds; the one promise-based wait for retries, backoff and dev delays. */
export const sleep = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, ms));
