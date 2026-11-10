/**
 * Token usage reported by the model, what it cost when the platform knows its prices, and what it
 * is charged at when an app bills for it.
 *
 * Each field may be undefined if the underlying provider doesn't report it.
 * `totalTokens` is the sum of input + output (plus any reasoning tokens, when applicable).
 */
export type AiStreamUsage = {
  /** Prompt tokens consumed. */
  inputTokens?: number;
  /** Completion tokens produced. */
  outputTokens?: number;
  /** Total tokens, typically `inputTokens + outputTokens` (+ reasoning, when applicable). */
  totalTokens?: number;
  /** Prompt tokens served from the prompt cache. */
  cacheReadInputTokens?: number;
  /** Prompt tokens written to the prompt cache by this request. */
  cacheWriteInputTokens?: number;
  /** Prompt tokens neither read from nor written to the cache. */
  noCacheInputTokens?: number;
  /** What the call cost at the platform's list price, in millionths of a US dollar. Set only by a platform that knows its prices. */
  costMicroUsd?: number;
  /** What the call is charged at an app's own rates, in millionths of a US dollar. Set by the app that bills for it, never by a platform. */
  chargeMicroUsd?: number;
};
