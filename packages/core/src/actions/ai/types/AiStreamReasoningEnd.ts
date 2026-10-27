import { AiStreamPartType } from './AiStreamPartType';

/**
 * End of the reasoning block opened by a matching {@link AiStreamReasoningStart} (same `id`).
 */
export interface AiStreamReasoningEnd {
  type: AiStreamPartType.ReasoningEnd;
  /** Identifier of the reasoning block being closed. */
  id: string;
}
