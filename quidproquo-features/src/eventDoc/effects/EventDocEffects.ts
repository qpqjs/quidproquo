import { EventDocCreateDraftEffect } from './EventDocCreateDraftEffect';
import { EventDocDeleteEffect } from './EventDocDeleteEffect';
import { EventDocInitStateEffect } from './EventDocInitStateEffect';
import { EventDocPublishEffect } from './EventDocPublishEffect';
import { EventDocRestoreEffect } from './EventDocRestoreEffect';
import { EventDocSetCodeEffect } from './EventDocSetCodeEffect';
import { EventDocSetNameEffect } from './EventDocSetNameEffect';

/** Union of the reserved (non-domain) event-doc effects in plain-payload form. */
export type EventDocEffects =
  | EventDocInitStateEffect
  | EventDocSetCodeEffect
  | EventDocSetNameEffect
  | EventDocCreateDraftEffect
  | EventDocPublishEffect
  | EventDocDeleteEffect
  | EventDocRestoreEffect;
