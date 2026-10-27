/**
 * A source the model cited while generating its response — used for grounded / RAG-style answers.
 *
 * `sourceType` is `'url'` for web sources and `'document'` for files/documents.
 * URL sources populate `url` (and optionally `title`); document sources populate `mediaType`.
 */
export interface AiStreamSource {
  /** Kind of source — typically `'url'` or `'document'`. */
  sourceType: string;
  /** Stable identifier for this source within the response. */
  id: string;
  /** URL of the source — present for `sourceType === 'url'`. */
  url?: string;
  /** Human-readable title for the source. */
  title?: string;
  /** IANA media type — present for `sourceType === 'document'`. */
  mediaType?: string;
  /** Optional filename — only set on document sources. */
  filename?: string;
}
