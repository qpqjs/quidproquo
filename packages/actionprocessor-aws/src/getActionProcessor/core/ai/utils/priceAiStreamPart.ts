import { AiStreamPart, AiStreamPartType } from '@qpqjs/core';

import { BedrockPricedCall } from '../types';
import { priceBedrockUsage } from './priceBedrockUsage';

/** A stream part with its usage priced: the finish of each step and of the whole call carry usage; every other part passes through. */
export const priceAiStreamPart = (part: AiStreamPart, call: BedrockPricedCall): AiStreamPart =>
  part.type === AiStreamPartType.Finish || part.type === AiStreamPartType.FinishStep ? { ...part, usage: priceBedrockUsage(part.usage, call) } : part;
