import { AiStreamPartType, AiStreamToolApprovalResponse } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamToolApprovalResponse = (part: AiSdkStreamPartOfType<'tool-approval-response'>): AiStreamToolApprovalResponse => ({
  type: AiStreamPartType.ToolApprovalResponse,
  approvalId: part.approvalId,
  toolCallId: part.toolCall.toolCallId,
  toolName: part.toolCall.toolName,
  approved: part.approved,
  reason: part.reason,
});
