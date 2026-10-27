import { AiStreamPartType } from './AiStreamPartType';

/**
 * A non-fatal error during streaming. The underlying SDK swallows errors by default
 * to keep the connection alive; this part surfaces them to the consumer.
 */
export interface AiStreamError {
  type: AiStreamPartType.Error;
  /** Stringified error message. */
  message: string;
}
