import { EventDocDocument } from '../../models';
import { EventDocBaseViewVersion } from './EventDocBaseViewVersion';
import { EventDocNextViewVersion } from './EventDocNextViewVersion';

/**
 * One revision of a doc type: every view as it existed at this version. The version is the doc type's revision counter,
 * bumped when the events or any view's shape changes, and stamped on every event the doc authors.
 */
export type EventDocBaseVersion<TViews extends Record<string, EventDocDocument> = Record<string, EventDocDocument>> = {
  version: number;
  views: { [K in keyof TViews]: EventDocBaseViewVersion<TViews[K]> };
};

/** A revision above the base: every view carries a migration from the previous version. */
export type EventDocNextVersion<TViews extends Record<string, EventDocDocument> = Record<string, EventDocDocument>> = {
  version: number;
  views: { [K in keyof TViews]: EventDocNextViewVersion<TViews[K]> };
};

/**
 * The full history of a doc type, oldest first: the base seeds, each tail entry migrates from the one before it.
 * Contiguity and view-set consistency are runtime guards (assertEventDocVersions), not type guards.
 */
// `any` is load-bearing: a fold reducer is contravariant in its view type, so a precisely-typed version does not satisfy
// a constraint over EventDocDocument. EventDocLatestViews recovers the precise shapes.
export type EventDocVersions = readonly [EventDocBaseVersion<any>, ...EventDocNextVersion<any>[]];
