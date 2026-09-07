import { Effect } from 'quidproquo-core';

import { EventDocManifestItem } from '../../models';
import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of SetManifest. */
export type EventDocExportUiSetManifestPayload = {
  items: EventDocManifestItem[];
};

/** Stores the manifest of the picked docs (empty returns to picking). */
export type EventDocExportUiSetManifestEffect = Effect<EventDocExportUiEffect.SetManifest, EventDocExportUiSetManifestPayload>;
