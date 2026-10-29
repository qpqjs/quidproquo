import { AiStreamPartType, AiStreamTextStart } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

/**
 *
 */
export const mapAiStreamTextStart = (part: AiSdkStreamPartOfType<'text-start'>): AiStreamTextStart => ({
  type: AiStreamPartType.TextStart,
  id: part.id,
});
