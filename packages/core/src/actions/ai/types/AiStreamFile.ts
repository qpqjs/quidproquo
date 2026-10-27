/**
 * A file artifact produced by the model (e.g. a generated image).
 *
 * The binary payload is delivered as base64 so the part can travel across
 * the JSON-encoded stream. Decode with `mediaType` to interpret the bytes.
 */
export interface AiStreamFile {
  /** File contents, base64-encoded. */
  base64: string;
  /** IANA media type — e.g. `'image/png'`. */
  mediaType: string;
}
