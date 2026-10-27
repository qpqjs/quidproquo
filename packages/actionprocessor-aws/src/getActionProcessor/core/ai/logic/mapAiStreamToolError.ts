import { AiStreamPartType, AiStreamToolError } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';
import { toErrorMessage } from './toErrorMessage';

export const mapAiStreamToolError = (part: AiSdkStreamPartOfType<'tool-error'>): AiStreamToolError => ({
  type: AiStreamPartType.ToolError,
  toolCallId: part.toolCallId,
  toolName: part.toolName,
  input: part.input,
  message: toErrorMessage(part.error),
});
