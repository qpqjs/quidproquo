import { Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocLink, EventDocListViewState, EventDocRenderInput, EventDocRenderResult, EventDocSnapshotViews } from '../../models';

/**
 * The invocation-side view of EventDocFunctions: every member required and typed by its resolved result, for
 * askDynamicFunctionExecute. A member missing at registration (no render) surfaces as the processor's FunctionNotFound.
 */
export type EventDocInvokableFunctions = {
  getSnapshotCacheKey: () => string;
  getServerEventTypes: () => string[];
  getListViewNames: () => string[];
  foldListView: (viewName: string, events: EventDocEvent[], seedState: unknown, trusted: boolean) => Nullable<EventDocListViewState>;
  migrateListViewStates: (viewName: string, states: unknown[]) => unknown[];
  foldSnapshotViews: (events: EventDocEvent[], seedViews?: EventDocSnapshotViews) => Nullable<EventDocSnapshotViews>;
  foldDocumentState: (events: EventDocEvent[], seedState?: unknown) => unknown;
  collectReferences: (events: EventDocEvent[]) => EventDocLink[];
  collectReferencesFromState: (state: unknown) => EventDocLink[];
  render: (input: EventDocRenderInput) => EventDocRenderResult;
  validateEvent: (event: EventDocEvent, state: unknown) => Nullable<string>;
};
