import { AiStreamPartType } from './AiStreamPartType';

/**
 * The model has started streaming the JSON arguments for a tool invocation.
 *
 * The fully-parsed call arrives later as {@link AiStreamToolCall}; use this if you want
 * to show "preparing to call tool X…" before the arguments finish streaming.
 */
export interface AiStreamToolInputStart {
  type: AiStreamPartType.ToolInputStart;
  /** Identifier shared by the matching `ToolInputDelta` / `ToolInputEnd` parts. */
  id: string;
  /** Name of the tool the model intends to call. */
  toolName: string;
}
