import { EventDocRenderKind } from './EventDocRenderKind';

/** Render output, discriminated by kind. Only Html is produced today. */
export type EventDocRenderResult =
  { kind: EventDocRenderKind.Html; html: string } | { kind: EventDocRenderKind.Css; css: string } | { kind: EventDocRenderKind.Blob; blobId: string };
