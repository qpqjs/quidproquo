import { AiStreamPartType, AiStreamToolApprovalRequest } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamToolApprovalRequest = (part: AiSdkStreamPartOfType<'tool-approval-request'>): AiStreamToolApprovalRequest => ({
  type: AiStreamPartType.ToolApprovalRequest,
  approvalId: part.approvalId,
  toolCallId: part.toolCall.toolCallId,
  toolName: part.toolCall.toolName,
  input: part.toolCall.input,
});
