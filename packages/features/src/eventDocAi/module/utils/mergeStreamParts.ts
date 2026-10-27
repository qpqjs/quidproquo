import type { AiStreamPart } from 'quidproquo-core';

import type { EventDocAiMessageSegment } from '../../models';
import { foldStreamPart } from './foldStreamPart';

/**
 * Folds a whole part stream into the durable segment format: consecutive text
 * and reasoning deltas merged, tool calls grouped and paired with their results.
 * The backend uses it once at stream end to build the message to save.
 */
export const mergeStreamParts = (parts: AiStreamPart[]): EventDocAiMessageSegment[] => parts.reduce(foldStreamPart, []);
