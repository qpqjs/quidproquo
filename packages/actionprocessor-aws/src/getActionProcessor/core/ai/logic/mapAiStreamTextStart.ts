import { AiStreamPartType, AiStreamTextStart } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamTextStart = (part: AiSdkStreamPartOfType<'text-start'>): AiStreamTextStart => ({
  type: AiStreamPartType.TextStart,
  id: part.id,
});
