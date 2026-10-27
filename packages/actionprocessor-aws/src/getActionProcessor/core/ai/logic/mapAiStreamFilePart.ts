import { AiStreamFilePart, AiStreamPartType } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamFilePart = (part: AiSdkStreamPartOfType<'file'>): AiStreamFilePart => ({
  type: AiStreamPartType.File,
  file: {
    base64: part.file.base64,
    mediaType: part.file.mediaType,
  },
});
