import type { EventDocExportUiOpenEffect } from './EventDocExportUiOpenEffect';
import type { EventDocExportUiResetEffect } from './EventDocExportUiResetEffect';
import type { EventDocExportUiSetCandidatesEffect } from './EventDocExportUiSetCandidatesEffect';
import type { EventDocExportUiSetErrorEffect } from './EventDocExportUiSetErrorEffect';
import type { EventDocExportUiSetExportingEffect } from './EventDocExportUiSetExportingEffect';
import type { EventDocExportUiSetLoadingEffect } from './EventDocExportUiSetLoadingEffect';
import type { EventDocExportUiSetManifestEffect } from './EventDocExportUiSetManifestEffect';
import type { EventDocExportUiSetResultEffect } from './EventDocExportUiSetResultEffect';
import type { EventDocExportUiToggleSelectedEffect } from './EventDocExportUiToggleSelectedEffect';

/** Union of the export dialog effects. */
export type EventDocExportUiEffects =
  | EventDocExportUiOpenEffect
  | EventDocExportUiSetCandidatesEffect
  | EventDocExportUiToggleSelectedEffect
  | EventDocExportUiSetLoadingEffect
  | EventDocExportUiSetManifestEffect
  | EventDocExportUiSetExportingEffect
  | EventDocExportUiSetResultEffect
  | EventDocExportUiSetErrorEffect
  | EventDocExportUiResetEffect;
