import { QpqIsoDateTime } from 'quidproquo-core';

import { EventDocRenderMode } from './EventDocRenderMode';

/** How a render resolves a doc's versions: mode plus as-of time. */
export type EventDocRenderOptions = {
  renderMode?: EventDocRenderMode;
  effectiveAt?: QpqIsoDateTime;
};
