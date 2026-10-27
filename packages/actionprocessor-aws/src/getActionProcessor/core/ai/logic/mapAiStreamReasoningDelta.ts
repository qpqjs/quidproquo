import { AiStreamPartType, AiStreamReasoningDelta } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamReasoningDelta = (part: AiSdkStreamPartOfType<'reasoning-delta'>): AiStreamReasoningDelta => ({
  type: AiStreamPartType.ReasoningDelta,
  id: part.id,
  text: part.text,
});
