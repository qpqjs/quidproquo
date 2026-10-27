import { AiStreamPartType, AiStreamToolInputDelta } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamToolInputDelta = (part: AiSdkStreamPartOfType<'tool-input-delta'>): AiStreamToolInputDelta => ({
  type: AiStreamPartType.ToolInputDelta,
  id: part.id,
  delta: part.delta,
});
