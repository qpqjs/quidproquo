import { EventDocBundleDoc } from './EventDocBundleDoc';
import { EventDocBundleSource } from './EventDocBundleSource';

/** The transfer artifact: one JSON file with the docs' logs and inlined asset bytes. */
export type EventDocBundle = {
  formatVersion: number;
  source: EventDocBundleSource;
  docs: EventDocBundleDoc[];
};
