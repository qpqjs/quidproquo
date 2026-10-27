import { Effect } from '@qpqjs/core';

import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Resets the workspace to its initial state. */
export type EventDocWorkspaceResetEffect = Effect<EventDocWorkspaceEffect.Reset>;
