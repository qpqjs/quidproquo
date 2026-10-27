import { Nullable } from 'quidproquo-core';

import { defaultEventDocEventValidator } from '../../validation/defaultEventDocEventValidator';
import { EventDocEditorValidator } from '../../validation/types/EventDocEditorValidator';
import { EventDocWorkspaceSlotFoldConfig } from '../types/EventDocWorkspaceSlotFoldConfig';
import { EventDocWorkspaceSlotKind } from '../types/EventDocWorkspaceSlotKind';

/**
 * The validator a slot's commits and rebases run. A document slot without one falls back to the lifecycle guard so a
 * published document cannot be silently mutated; a local slot without one accepts everything.
 */
export const getSlotValidator = (slot: EventDocWorkspaceSlotFoldConfig): Nullable<EventDocEditorValidator> =>
  slot.kind === EventDocWorkspaceSlotKind.document ? (slot.validate ?? defaultEventDocEventValidator) : (slot.validate ?? null);
