import { QpqReducer } from '@qpqjs/core';

import { EventDocBaseViewVersion } from '../../definition/types/EventDocBaseViewVersion';
import { EVENT_DOC_SUMMARY_VIEW } from '../../definition/types/EventDocLatestViews';
import { EventDocNextViewVersion } from '../../definition/types/EventDocNextViewVersion';
import { EventDocDocument, EventDocEvent } from '../../models';
import { eventDocSummaryReducer } from '../eventDocSummaryReducer';
import { createEventDocSummarySeed } from './createEventDocSummarySeed';

// Structural, like buildEventDocViewFoldConfig's: a doc type's history as the fold machinery reads it.
type EventDocVersionEntry = {
  version: number;
  // `any` for the same reason as EventDocVersions: a fold reducer is contravariant in its view type.
  views: Record<string, EventDocBaseViewVersion<any> | EventDocNextViewVersion<any>>;
};

// Cast: the summary's state extends EventDocDocument, and the version entries hold reducers over the base shape.
const summaryReducer = eventDocSummaryReducer as unknown as QpqReducer<EventDocDocument, EventDocEvent>;

/**
 * A doc type's version history with the summary view declared at every version: seeded at the base, and carried
 * unchanged through each later one. This is what makes the summary an ordinary view: it is folded, snapshotted,
 * resumed and climbed by the same code as the views a doc type declares itself.
 */
export const withEventDocSummaryView = (versions: readonly EventDocVersionEntry[]): EventDocVersionEntry[] =>
  versions.map((version, index) => ({
    ...version,
    views: {
      ...version.views,
      [EVENT_DOC_SUMMARY_VIEW]:
        index === 0
          ? { foldReducer: summaryReducer, createInitialViewState: createEventDocSummarySeed }
          : { foldReducer: summaryReducer, migrateFromPrevious: (state: EventDocDocument) => state },
    },
  }));
