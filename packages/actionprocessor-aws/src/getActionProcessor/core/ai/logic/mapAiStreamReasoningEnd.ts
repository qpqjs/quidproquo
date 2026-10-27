import { AiStreamPartType, AiStreamReasoningEnd } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamReasoningEnd = (part: AiSdkStreamPartOfType<'reasoning-end'>): AiStreamReasoningEnd => ({
  type: AiStreamPartType.ReasoningEnd,
  id: part.id,
});
