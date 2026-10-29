import { AiStreamPartType, AiStreamTextEnd } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

/**
 *
 */
export const mapAiStreamTextEnd = (part: AiSdkStreamPartOfType<'text-end'>): AiStreamTextEnd => ({
  type: AiStreamPartType.TextEnd,
  id: part.id,
});
