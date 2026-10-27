import type { EventDocListAddItemEffect } from './EventDocListAddItemEffect';
import type { EventDocListPageLoadedEffect } from './EventDocListPageLoadedEffect';
import type { EventDocListSetConfigEffect } from './EventDocListSetConfigEffect';
import type { EventDocListSetErrorEffect } from './EventDocListSetErrorEffect';
import type { EventDocListSetLoadingEffect } from './EventDocListSetLoadingEffect';
import type { EventDocListSetPageIndexEffect } from './EventDocListSetPageIndexEffect';
import type { EventDocListSetPageSizeEffect } from './EventDocListSetPageSizeEffect';

/** Union of the list effects. */
export type EventDocListEffects =
  | EventDocListSetConfigEffect
  | EventDocListPageLoadedEffect
  | EventDocListAddItemEffect
  | EventDocListSetLoadingEffect
  | EventDocListSetErrorEffect
  | EventDocListSetPageIndexEffect
  | EventDocListSetPageSizeEffect;
