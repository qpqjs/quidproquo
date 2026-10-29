import { AiStreamPartType, AiStreamReasoningStart } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

/**
 *
 */
export const mapAiStreamReasoningStart = (part: AiSdkStreamPartOfType<'reasoning-start'>): AiStreamReasoningStart => ({
  type: AiStreamPartType.ReasoningStart,
  id: part.id,
});
