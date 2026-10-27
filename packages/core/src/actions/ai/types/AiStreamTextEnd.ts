import { AiStreamPartType } from './AiStreamPartType';

/**
 * End of the text block opened by a matching {@link AiStreamTextStart} (same `id`).
 */
export interface AiStreamTextEnd {
  type: AiStreamPartType.TextEnd;
  /** Identifier of the text block being closed. */
  id: string;
}
