import { stepCountIs, StopCondition, ToolSet } from 'ai';

export type AiStopLimits = {
  maxSteps?: number;
  maxDurationMs?: number;
};

/**
 * The `stopWhen` set for a prompt. The SDK defaults to a single step, so this always
 * returns a list, even an empty one: with no limits the loop runs until the model stops
 * on its own (a client-side tool call still halts it). Conditions only run between
 * steps, so the time cap can overrun by one step; callers leave headroom. Its clock
 * starts when this is built, which is just before the SDK call.
 */
export const buildAiStopConditions = ({ maxSteps, maxDurationMs }: AiStopLimits, now: () => number = Date.now): StopCondition<ToolSet>[] => {
  const conditions: StopCondition<ToolSet>[] = [];

  if (maxSteps !== undefined) {
    conditions.push(stepCountIs(maxSteps));
  }

  if (maxDurationMs !== undefined) {
    const startedAt = now();
    conditions.push(() => now() - startedAt >= maxDurationMs);
  }

  return conditions;
};
