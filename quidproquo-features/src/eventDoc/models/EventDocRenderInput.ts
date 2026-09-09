import { EventDocRenderOptions } from './EventDocRenderOptions';
import { EventDocVersion } from './EventDocVersion';

/**
 * Input to a collection's `render` function. `state` is already folded at the resolved point (renderMode/effectiveAt
 * are echoed, not for the renderer to re-apply); `version` is set only when a published version was resolved.
 */
export type EventDocRenderInput = {
  state: unknown;
  docId: string;
  version?: EventDocVersion;
} & EventDocRenderOptions;
