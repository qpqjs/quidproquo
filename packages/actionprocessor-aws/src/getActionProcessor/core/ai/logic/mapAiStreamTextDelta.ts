import { AiStreamPartType, AiStreamTextDelta } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamTextDelta = (part: AiSdkStreamPartOfType<'text-delta'>): AiStreamTextDelta => ({
  type: AiStreamPartType.TextDelta,
  id: part.id,
  text: part.text,
});
