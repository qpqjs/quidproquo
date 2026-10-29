import { AiStreamPartType, AiStreamReasoningDelta } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

/**
 *
 */
export const mapAiStreamReasoningDelta = (part: AiSdkStreamPartOfType<'reasoning-delta'>): AiStreamReasoningDelta => ({
  type: AiStreamPartType.ReasoningDelta,
  id: part.id,
  text: part.text,
});
