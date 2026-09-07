import { Nullable } from 'quidproquo-core';

import { EventDocEvent } from '../../models';

/**
 * Validates an event against the document's folded live state (never the raw log: a bootstrap-loaded editor holds only
 * the events after its snapshot). `unknown` because local slots may validate too; createEventDocEventValidator narrows.
 */
export type EventDocEditorValidator = (event: EventDocEvent, state: unknown) => Nullable<string>;
