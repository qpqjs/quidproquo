import { AiStreamPartType } from './AiStreamPartType';

/**
 * A tool threw while executing.
 *
 * `toolCallId` matches the originating {@link AiStreamToolCall}. The error is stringified
 * into `message` so the part stays JSON-serializable.
 */
export interface AiStreamToolError {
  type: AiStreamPartType.ToolError;
  /** Id of the tool call that errored. */
  toolCallId: string;
  /** Name of the tool that threw. */
  toolName: string;
  /** The arguments the tool was called with. */
  input: unknown;
  /** Stringified error message. */
  message: string;
}
