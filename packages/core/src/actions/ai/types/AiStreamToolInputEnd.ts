import { AiStreamPartType } from './AiStreamPartType';

/**
 * The model has finished streaming arguments for a tool invocation.
 *
 * A {@link AiStreamToolCall} with the parsed arguments follows shortly.
 */
export interface AiStreamToolInputEnd {
  type: AiStreamPartType.ToolInputEnd;
  /** Identifier of the argument stream being closed. */
  id: string;
}
