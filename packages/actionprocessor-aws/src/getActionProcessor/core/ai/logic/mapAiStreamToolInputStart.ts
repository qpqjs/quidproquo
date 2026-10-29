import { AiStreamPartType, AiStreamToolInputStart } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

/**
 *
 */
export const mapAiStreamToolInputStart = (part: AiSdkStreamPartOfType<'tool-input-start'>): AiStreamToolInputStart => ({
  type: AiStreamPartType.ToolInputStart,
  id: part.id,
  toolName: part.toolName,
});
