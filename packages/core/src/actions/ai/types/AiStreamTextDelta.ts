import { AiStreamPartType } from './AiStreamPartType';

/**
 * An incremental chunk of visible model text inside an open text block.
 *
 * Concatenate all deltas sharing the same `id` to reconstruct the block's full text.
 * This is the part to render in a typewriter-style UI.
 */
export interface AiStreamTextDelta {
  type: AiStreamPartType.TextDelta;
  /** Identifier of the text block this delta belongs to. */
  id: string;
  /** The new text fragment to append. */
  text: string;
}
