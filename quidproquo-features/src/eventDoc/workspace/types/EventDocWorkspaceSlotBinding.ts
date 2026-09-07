import { Nullable } from 'quidproquo-core';

import { EventDocEditorValidator } from '../../validation';
import { EventDocWorkspaceState } from './EventDocWorkspaceState';

/** What the slot overrides need at bind time. Coalesce rules are not here: coalescing happens in the reducer. */
export type EventDocWorkspaceSlotBinding = {
  slotKey: string;
  schemaVersion: number;
  validate: Nullable<EventDocEditorValidator>;
  // The slot's memoized view selector (history + pending + transients).
  getView: (state: EventDocWorkspaceState) => unknown;
  // History + pending only, migrated to latest. Transients never save, so they must not affect a validation verdict.
  getValidationView: (state: EventDocWorkspaceState) => unknown;
};
