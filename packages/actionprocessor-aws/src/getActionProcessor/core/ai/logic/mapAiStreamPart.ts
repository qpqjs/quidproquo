import { AiStreamPart } from 'quidproquo-core';

import { AiSdkStreamPart } from '../types';
import { aiStreamPartMappers } from './aiStreamPartMappers';

export const mapAiStreamPart = (part: AiSdkStreamPart): AiStreamPart => {
  const mapper = aiStreamPartMappers[part.type] as (p: AiSdkStreamPart) => AiStreamPart;
  return mapper(part);
};
