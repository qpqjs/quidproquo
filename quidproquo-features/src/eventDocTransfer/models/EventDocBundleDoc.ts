import { EventDocEvent } from '../../eventDoc/models';
import { EventDocBundleAsset } from './EventDocBundleAsset';
import { EventDocDocRef } from './EventDocDocRef';

/** One doc in a bundle: its complete log plus asset bytes. No summary travels; the target folds its own. */
export type EventDocBundleDoc = EventDocDocRef & {
  events: EventDocEvent[];
  assets: EventDocBundleAsset[];
};
