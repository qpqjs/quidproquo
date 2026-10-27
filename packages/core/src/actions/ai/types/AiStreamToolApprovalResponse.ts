import { AiStreamPartType } from './AiStreamPartType';

/**
 * The approve/deny decision for a prior {@link AiStreamToolApprovalRequest}.
 */
export interface AiStreamToolApprovalResponse {
  type: AiStreamPartType.ToolApprovalResponse;
  /** Identifier of the approval request this response answers. */
  approvalId: string;
  /** Id of the underlying tool call the decision is for. */
  toolCallId: string;
  /** Name of the tool the decision is for. */
  toolName: string;
  /** Whether the tool call was approved. */
  approved: boolean;
  /** Optional reason for the approval or denial. */
  reason?: string;
}
