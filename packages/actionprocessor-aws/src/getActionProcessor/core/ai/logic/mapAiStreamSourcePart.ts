import { AiStreamPartType, AiStreamSourcePart } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamSourcePart = (part: AiSdkStreamPartOfType<'source'>): AiStreamSourcePart => ({
  type: AiStreamPartType.Source,
  source: {
    sourceType: part.sourceType,
    id: part.id,
    url: 'url' in part ? part.url : undefined,
    title: 'title' in part ? part.title : undefined,
    mediaType: 'mediaType' in part ? part.mediaType : undefined,
    filename: 'filename' in part ? part.filename : undefined,
  },
});
