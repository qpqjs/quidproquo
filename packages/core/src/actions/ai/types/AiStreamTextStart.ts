import { AiStreamPartType } from './AiStreamPartType';

/**
 * Beginning of a contiguous block of visible model text.
 *
 * Pair with the matching {@link AiStreamTextEnd} (same `id`). Deltas for this block
 * arrive as {@link AiStreamTextDelta} with the same `id` in between.
 */
export interface AiStreamTextStart {
  type: AiStreamPartType.TextStart;
  /** Identifier shared by the matching `TextDelta` / `TextEnd` parts. */
  id: string;
}
