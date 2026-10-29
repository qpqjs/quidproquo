import type { PrepareStepFunction, ToolSet } from 'ai';

import { BedrockCacheSettings } from '../types';
import { toCacheableMessages } from './toCacheableMessages';

export type CachePrepareStepOptions = BedrockCacheSettings & {
  /** How many leading messages are the saved conversation; the turn context follows them. */
  durableCount: number;
};

/**
 * The per-step hook that owns message cache points. The SDK appends tool calls and results
 * between steps with no points and carries the previous step's marked list forward, so every step
 * re-marks from scratch. Step 0's list ends on the per-request turn context, which stays
 * unmarked; from step 1 the tail is tool traffic worth caching for the step after it.
 */
export const createCachePrepareStep =
  ({ durableCount, ...cache }: CachePrepareStepOptions): PrepareStepFunction<ToolSet> =>
  ({ messages, stepNumber }) => ({
    messages: toCacheableMessages(messages, true, { ...cache, durableCount, markTail: stepNumber > 0 }),
  });
