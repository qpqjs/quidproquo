import { AiStreamPartType } from './AiStreamPartType';

/**
 * Beginning of a reasoning ("thinking") block — emitted by extended-thinking models.
 *
 * Reasoning text is the model's internal scratchpad; render it separately from visible text.
 */
export interface AiStreamReasoningStart {
  type: AiStreamPartType.ReasoningStart;
  /** Identifier shared by the matching `ReasoningDelta` / `ReasoningEnd` parts. */
  id: string;
}
