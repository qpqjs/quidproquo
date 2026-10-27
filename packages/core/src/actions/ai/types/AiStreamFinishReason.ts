/**
 * Why a generation (or a single step) stopped. Values mirror the AI SDK's `FinishReason`
 * wire strings, which action processors pass through verbatim.
 *
 * On the final {@link AiStreamFinish} part, `toolCalls` means the loop was halted early:
 * a stop condition (e.g. a step limit) tripped while the model still wanted to keep acting,
 * so the turn can be resumed by re-sending the recorded history. A natural completion
 * finishes with `stop`.
 */
export enum AiStreamFinishReasonEnum {
  /** The model completed its answer naturally. */
  stop = 'stop',
  /** The response hit the output token limit. */
  length = 'length',
  /** The provider's content filter stopped the response. */
  contentFilter = 'content-filter',
  /** Generation stopped while the model still had tool calls in flight (halted early). */
  toolCalls = 'tool-calls',
  /** The stream errored. */
  error = 'error',
  /** The provider reported a reason outside this catalog. */
  other = 'other',
  /** The provider reported no reason, or one this version does not recognise. */
  unknown = 'unknown',
}
