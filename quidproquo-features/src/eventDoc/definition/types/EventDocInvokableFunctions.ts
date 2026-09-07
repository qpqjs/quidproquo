import { Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocLink, EventDocRenderInput, EventDocRenderResult, EventDocSnapshotViews } from '../../models';

/**
 * The invocation-side view of EventDocFunctions: every member required and typed by its resolved result, for
 * askDynamicFunctionExecute. A member missing at registration (no render) surfaces as the processor's FunctionNotFound.
 */
export type EventDocInvokableFunctions = {
  foldSnapshotViews: (events: EventDocEvent[], seedViews?: EventDocSnapshotViews) => Nullable<EventDocSnapshotViews>;
  foldDocumentState: (events: EventDocEvent[], seedState?: unknown) => unknown;
  collectReferences: (events: EventDocEvent[]) => EventDocLink[];
  collectReferencesFromState: (state: unknown) => EventDocLink[];
  render: (input: EventDocRenderInput) => EventDocRenderResult;
  validateEvent: (event: EventDocEvent, state: unknown) => Nullable<string>;
};
