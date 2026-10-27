import { AiStreamPartType } from './AiStreamPartType';

/**
 * An incremental chunk of raw JSON arguments for an in-flight tool call.
 *
 * Concatenated deltas form partial-but-unparsed JSON — use only for previews. The fully
 * parsed `input` arrives later on {@link AiStreamToolCall}.
 */
export interface AiStreamToolInputDelta {
  type: AiStreamPartType.ToolInputDelta;
  /** Identifier of the tool-argument stream this delta belongs to. */
  id: string;
  /** New JSON fragment to append. */
  delta: string;
}
