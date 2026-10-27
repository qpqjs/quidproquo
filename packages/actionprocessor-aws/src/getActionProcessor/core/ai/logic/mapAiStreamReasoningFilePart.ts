import { AiStreamPartType, AiStreamReasoningFilePart } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamReasoningFilePart = (part: AiSdkStreamPartOfType<'reasoning-file'>): AiStreamReasoningFilePart => ({
  type: AiStreamPartType.ReasoningFile,
  file: {
    base64: part.file.base64,
    mediaType: part.file.mediaType,
  },
});
