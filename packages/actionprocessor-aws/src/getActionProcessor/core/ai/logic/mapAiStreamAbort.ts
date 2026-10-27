import { AiStreamAbort, AiStreamPartType } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamAbort = (part: AiSdkStreamPartOfType<'abort'>): AiStreamAbort => ({
  type: AiStreamPartType.Abort,
  reason: part.reason,
});
