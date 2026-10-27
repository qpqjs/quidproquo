import { AiStreamPartType, AiStreamReasoningStart } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamReasoningStart = (part: AiSdkStreamPartOfType<'reasoning-start'>): AiStreamReasoningStart => ({
  type: AiStreamPartType.ReasoningStart,
  id: part.id,
});
