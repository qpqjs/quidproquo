import { AiStreamPartType } from './AiStreamPartType';

/**
 * An incremental chunk of reasoning text inside an open reasoning block.
 *
 * Concatenate all deltas sharing the same `id` to reconstruct the block's full reasoning.
 */
export interface AiStreamReasoningDelta {
  type: AiStreamPartType.ReasoningDelta;
  /** Identifier of the reasoning block this delta belongs to. */
  id: string;
  /** The new reasoning fragment to append. */
  text: string;
}
