import { AiStreamFinishReasonEnum } from './AiStreamFinishReason';
import { AiStreamPartType } from './AiStreamPartType';
import { AiStreamUsage } from './AiStreamUsage';

/**
 * Emitted once at the very end of the response with the aggregate finish reason and total usage
 * across every step. Use this (not `FinishStep`) for end-of-response accounting.
 */
export interface AiStreamFinish {
  type: AiStreamPartType.Finish;
  /** Why the model stopped. `toolCalls` here means the loop was halted early and is resumable. */
  finishReason: AiStreamFinishReasonEnum;
  /** The provider's own stop reason string, when it reported one; explains an `other` or `unknown` reason. */
  rawFinishReason?: string;
  /** Aggregate token usage across all steps. */
  usage: AiStreamUsage;
}
