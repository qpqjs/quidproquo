import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocManifestItem } from '../../models';
import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetManifestEffect } from '../effects/EventDocExportUiSetManifestEffect';

/** Dispatches SetManifest. */
export function* askUIEventDocExportSetManifest(items: EventDocManifestItem[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetManifestEffect>(EventDocExportUiEffect.SetManifest, { items });
}
