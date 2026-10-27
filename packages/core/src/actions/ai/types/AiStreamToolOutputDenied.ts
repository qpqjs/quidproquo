import { AiStreamPartType } from './AiStreamPartType';

/**
 * The caller denied executing a tool that the model requested via {@link AiStreamToolApprovalRequest}.
 *
 * The model will see the denial and continue without the tool's output.
 */
export interface AiStreamToolOutputDenied {
  type: AiStreamPartType.ToolOutputDenied;
  /** Id of the tool call that was denied. */
  toolCallId: string;
  /** Name of the tool that was denied. */
  toolName: string;
}
