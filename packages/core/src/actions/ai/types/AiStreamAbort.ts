import { AiStreamPartType } from './AiStreamPartType';

/**
 * The stream was aborted before completion — e.g. an abort signal fired or the client disconnected.
 *
 * No `Finish` part will follow an `Abort`.
 */
export interface AiStreamAbort {
  type: AiStreamPartType.Abort;
  /** Optional human-readable reason for the abort. */
  reason?: string;
}
