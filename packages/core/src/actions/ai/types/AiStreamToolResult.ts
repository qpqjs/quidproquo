import { AiStreamPartType } from './AiStreamPartType';

/**
 * A tool finished executing successfully — the model will use `output` in its next step.
 *
 * `toolCallId` matches the originating {@link AiStreamToolCall}.
 */
export interface AiStreamToolResult {
  type: AiStreamPartType.ToolResult;
  /** Id of the tool call this result corresponds to. */
  toolCallId: string;
  /** Name of the tool that executed. */
  toolName: string;
  /** The arguments the tool was called with (echoed for convenience). */
  input: unknown;
  /** The tool's return value. */
  output: unknown;
}
