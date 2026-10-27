import { AiStreamPartType, AiStreamToolInputEnd } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamToolInputEnd = (part: AiSdkStreamPartOfType<'tool-input-end'>): AiStreamToolInputEnd => ({
  type: AiStreamPartType.ToolInputEnd,
  id: part.id,
});
