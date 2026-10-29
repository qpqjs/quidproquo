import { AiStreamPartType, AiStreamToolResult } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

/**
 *
 */
export const mapAiStreamToolResult = (part: AiSdkStreamPartOfType<'tool-result'>): AiStreamToolResult => ({
  type: AiStreamPartType.ToolResult,
  toolCallId: part.toolCallId,
  toolName: part.toolName,
  input: part.input,
  output: part.output,
});
