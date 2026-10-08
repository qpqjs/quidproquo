import { AiStreamFinishReasonEnum } from './AiStreamFinishReason';
import { AiStreamPartType } from './AiStreamPartType';
import { AiStreamUsage } from './AiStreamUsage';

/**
 * The current generation step ended.
 *
 * For total-response accounting use {@link AiStreamFinish}; this carries the per-step slice only.
 */
export interface AiStreamFinishStep {
  type: AiStreamPartType.FinishStep;
  /** Why this step stopped — `toolCalls` between steps, `stop` on the final step. */
  finishReason: AiStreamFinishReasonEnum;
  /** The provider's own stop reason string, when it reported one; explains an `other` or `unknown` reason. */
  rawFinishReason?: string;
  /** Token usage for this step only. */
  usage: AiStreamUsage;
}
