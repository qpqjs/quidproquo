import { AiStreamPartType, AiStreamToolInputEnd } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

/**
 *
 */
export const mapAiStreamToolInputEnd = (part: AiSdkStreamPartOfType<'tool-input-end'>): AiStreamToolInputEnd => ({
  type: AiStreamPartType.ToolInputEnd,
  id: part.id,
});
