import { EventDocEditorValidator } from './types/EventDocEditorValidator';

/**
 * Wraps a validator with the schema-version ceiling: an event whose `metadata.version` is missing, not a positive
 * integer, or above `latestVersion` is refused before the inner rules run. Older versions pass (migrations carry them
 * forward). Not a nicety: the log is append-only, so an event the fold has no reducer for would be stored permanently
 * and throw on every subsequent read of the document.
 */
export const withEventDocSchemaVersionCeiling =
  (latestVersion: number, inner: EventDocEditorValidator): EventDocEditorValidator =>
  (event, state) => {
    const version = event.payload?.metadata?.version;

    if (!Number.isInteger(version) || version < 1 || version > latestVersion) {
      return `Event schema version ${String(version)} is not one this document can fold (latest: ${latestVersion}) - refused, since an unreadable event in the append-only log would make the document unreadable.`;
    }

    return inner(event, state);
  };
