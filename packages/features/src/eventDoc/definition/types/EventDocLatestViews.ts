import { EventDocDocument } from '../../models';
import { EventDocBaseViewVersion } from './EventDocBaseViewVersion';
import { EventDocNextViewVersion } from './EventDocNextViewVersion';

/** The view every saved doc type must declare: the one the workspace mounts, the validators gate, and `references` walks. */
export const EVENT_DOC_PRIMARY_VIEW = 'document';

/** The primary view's name as a type. */
export type EventDocPrimaryViewName = typeof EVENT_DOC_PRIMARY_VIEW;

// The state a single view version folds to.
type EventDocViewStateOf<TViewVersion> =
  TViewVersion extends EventDocBaseViewVersion<infer TView> ? TView : TViewVersion extends EventDocNextViewVersion<infer TView> ? TView : never;

/** The view shapes of the last entry in a versions tuple: what a consumer reads, since every fold climbs to latest. */
export type EventDocLatestViews<TVersions extends readonly unknown[]> = TVersions extends readonly [...unknown[], infer TLatest]
  ? TLatest extends { views: infer TViews }
    ? { [K in keyof TViews]: EventDocViewStateOf<TViews[K]> }
    : never
  : never;

/** The latest shape of the primary view: what `validators`, `references` and the mounted slot are typed against. */
export type EventDocPrimaryView<TVersions extends readonly unknown[]> =
  EventDocLatestViews<TVersions> extends Record<EventDocPrimaryViewName, infer TView extends EventDocDocument> ? TView : never;

/** The view every event doc has without declaring it: the fold of the reserved lifecycle events. Needs no version entries. */
export const EVENT_DOC_SUMMARY_VIEW = 'summary';

/** The summary view's name as a type. */
export type EventDocSummaryViewName = typeof EVENT_DOC_SUMMARY_VIEW;
