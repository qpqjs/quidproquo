import { AiStreamPartType } from './AiStreamPartType';

/**
 * The model wants to execute a tool but the tool is configured to require approval.
 *
 * Respond with an approval message (or a `ToolOutputDenied`) keyed by `approvalId`
 * before the model will proceed.
 */
export interface AiStreamToolApprovalRequest {
  type: AiStreamPartType.ToolApprovalRequest;
  /** Identifier the approve/deny response must reference. */
  approvalId: string;
  /** Id of the underlying tool call awaiting approval. */
  toolCallId: string;
  /** Name of the tool awaiting approval. */
  toolName: string;
  /** Arguments the tool would be called with if approved. */
  input: unknown;
}
