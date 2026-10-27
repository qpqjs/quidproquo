import { AiStreamPartType, AiStreamToolInputStart } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamToolInputStart = (part: AiSdkStreamPartOfType<'tool-input-start'>): AiStreamToolInputStart => ({
  type: AiStreamPartType.ToolInputStart,
  id: part.id,
  toolName: part.toolName,
});
