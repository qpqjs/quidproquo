import { AiStreamError, AiStreamPartType } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';
import { toErrorMessage } from './toErrorMessage';

export const mapAiStreamError = (part: AiSdkStreamPartOfType<'error'>): AiStreamError => ({
  type: AiStreamPartType.Error,
  message: toErrorMessage(part.error),
});
