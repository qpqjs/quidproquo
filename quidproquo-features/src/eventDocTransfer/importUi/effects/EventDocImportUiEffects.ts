import type { EventDocImportUiResetEffect } from './EventDocImportUiResetEffect';
import type { EventDocImportUiSetApplyingEffect } from './EventDocImportUiSetApplyingEffect';
import type { EventDocImportUiSetErrorEffect } from './EventDocImportUiSetErrorEffect';
import type { EventDocImportUiSetLoadingEffect } from './EventDocImportUiSetLoadingEffect';
import type { EventDocImportUiSetPlanEffect } from './EventDocImportUiSetPlanEffect';
import type { EventDocImportUiSetResultEffect } from './EventDocImportUiSetResultEffect';

/** Union of the import screen effects. */
export type EventDocImportUiEffects =
  | EventDocImportUiSetLoadingEffect
  | EventDocImportUiSetPlanEffect
  | EventDocImportUiSetApplyingEffect
  | EventDocImportUiSetResultEffect
  | EventDocImportUiSetErrorEffect
  | EventDocImportUiResetEffect;
