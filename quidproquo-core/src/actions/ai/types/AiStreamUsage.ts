/**
 * Token usage reported by the model.
 *
 * Each field may be undefined if the underlying provider doesn't report it.
 * `totalTokens` is the sum of input + output (plus any reasoning tokens, when applicable).
 */
export interface AiStreamUsage {
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
}
