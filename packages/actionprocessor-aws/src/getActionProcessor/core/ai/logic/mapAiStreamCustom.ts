import { AiStreamCustom, AiStreamPartType } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';

export const mapAiStreamCustom = (part: AiSdkStreamPartOfType<'custom'>): AiStreamCustom => ({
  type: AiStreamPartType.Custom,
  kind: part.kind,
});
