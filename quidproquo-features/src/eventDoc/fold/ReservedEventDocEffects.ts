import { EventDocEffects } from '../effects/EventDocEffects';
import { EventDocFoldEffects } from './EventDocFoldEffects';

/** Every reserved effect the base reducer folds, in the stored shape (data wrapped in EventDocEventPayload). */
export type ReservedEventDocEffects = EventDocFoldEffects<EventDocEffects>;
