import { AiStreamFinish, AiStreamPartType } from '@qpqjs/core';

import { AiSdkStreamPartOfType } from '../types';
import { toAiStreamFinishReason } from './toAiStreamFinishReason';
import { toAiStreamUsage } from './toAiStreamUsage';

export const mapAiStreamFinish = (part: AiSdkStreamPartOfType<'finish'>): AiStreamFinish => ({
  type: AiStreamPartType.Finish,
  finishReason: toAiStreamFinishReason(part.finishReason, part.rawFinishReason),
  ...(part.rawFinishReason ? { rawFinishReason: part.rawFinishReason } : {}),
  usage: toAiStreamUsage(part.totalUsage),
});
