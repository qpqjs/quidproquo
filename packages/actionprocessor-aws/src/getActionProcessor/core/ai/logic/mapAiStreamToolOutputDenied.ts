import { AiStreamPartType, AiStreamToolOutputDenied } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamToolOutputDenied = (part: AiSdkStreamPartOfType<'tool-output-denied'>): AiStreamToolOutputDenied => ({
  type: AiStreamPartType.ToolOutputDenied,
  toolCallId: part.toolCallId,
  toolName: part.toolName,
});
