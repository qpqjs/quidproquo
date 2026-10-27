import { AiStreamPartType } from './AiStreamPartType';

/**
 * A fully-formed tool call — the model finished producing arguments and they parsed cleanly.
 *
 * Execution still has to happen; a {@link AiStreamToolResult} or {@link AiStreamToolError}
 * with the same `toolCallId` follows once it does.
 */
export interface AiStreamToolCall {
  type: AiStreamPartType.ToolCall;
  /** Unique id correlating this call with its later result / error / approval. */
  toolCallId: string;
  /** Name of the tool being invoked. */
  toolName: string;
  /** Parsed tool arguments (shape depends on the tool's schema). */
  input: unknown;
}
