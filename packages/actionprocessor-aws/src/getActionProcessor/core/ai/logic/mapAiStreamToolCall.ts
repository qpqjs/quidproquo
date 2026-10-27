import { AiStreamPartType, AiStreamToolCall } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamToolCall = (part: AiSdkStreamPartOfType<'tool-call'>): AiStreamToolCall => ({
  type: AiStreamPartType.ToolCall,
  toolCallId: part.toolCallId,
  toolName: part.toolName,
  input: part.input,
});
