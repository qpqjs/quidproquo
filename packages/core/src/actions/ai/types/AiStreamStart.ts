import { AiStreamPartType } from './AiStreamPartType';

/**
 * Emitted once, before any other part, marks the beginning of the overall response.
 */
export type AiStreamStart = {
  type: AiStreamPartType.Start;
};
