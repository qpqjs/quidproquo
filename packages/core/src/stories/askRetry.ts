import { askDelay, askNewGuid } from '../actions';
import { AskResponse } from '../types';
import { askCatch } from './system';

export type AskRetryOptions = {
  // Multiply the wait by the attempt number (1-based) — linear backoff for
  // contended resources instead of a fixed interval.
  linearBackoff?: boolean;

  // Add 0..maxJitterMs of guid-derived jitter to each wait, so concurrent
  // losers of a shared race spread out instead of retrying in lockstep.
  // (Stories cannot use Math.random; askNewGuid is the replay-safe entropy
  // source.)
  maxJitterMs?: number;
};

export function* askRetry<R>(
  askRunLogic: () => AskResponse<R>,
  maxRetries: number,
  timeToWaitMs: number,
  errorTypeRetryList?: string[],
  options?: AskRetryOptions,
): ReturnType<typeof askCatch<AskResponse<R>>> {
  let attempt = 0;

  while (true) {
    const result = yield* askCatch(askRunLogic());
    attempt = attempt + 1;

    if (result.success || attempt > maxRetries) {
      return result;
    }

    if (errorTypeRetryList) {
      if (!errorTypeRetryList.includes(result.error.errorType)) {
        return result;
      }
    }

    let waitMs = options?.linearBackoff ? timeToWaitMs * attempt : timeToWaitMs;

    if (options?.maxJitterMs) {
      const guid = yield* askNewGuid();
      const jitterByte = parseInt(guid.slice(0, 2), 16);

      // Guid processors are platform-pluggable, so guard against a non-hex id
      // poisoning the wait with NaN.
      if (!Number.isNaN(jitterByte)) {
        waitMs += Math.floor((jitterByte / 255) * options.maxJitterMs);
      }
    }

    yield* askDelay(waitMs);
  }
}
