import { AiStreamPartType } from './AiStreamPartType';

/**
 * A provider-specific custom event that didn't map to any higher-level part.
 *
 * The payload is not forwarded — `kind` identifies the event for debugging or custom handling.
 */
export interface AiStreamCustom {
  type: AiStreamPartType.Custom;
  /** Provider-defined identifier for the custom event (e.g. `provider.eventName`). */
  kind: string;
}
