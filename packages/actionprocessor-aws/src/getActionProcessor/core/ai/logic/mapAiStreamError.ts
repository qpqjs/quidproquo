import { AiStreamError, AiStreamPartType } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';
import { toErrorMessage } from './toErrorMessage';

export const mapAiStreamError = (part: AiSdkStreamPartOfType<'error'>): AiStreamError => ({
  type: AiStreamPartType.Error,
  message: toErrorMessage(part.error),
});
