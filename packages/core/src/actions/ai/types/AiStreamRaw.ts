import { AiStreamPartType } from './AiStreamPartType';

/**
 * A provider-specific raw chunk that didn't map to any higher-level part.
 *
 * The raw payload is not forwarded — this part exists as a marker for debugging or telemetry.
 */
export interface AiStreamRaw {
  type: AiStreamPartType.Raw;
}
