import { askInlineFunctionExecute, AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocStoreRead } from '../context/askEventDocStoreRead';
import { EventDocEffect, EventDocEvent, EventDocOnAppendInput, EventDocOnPublishInput, EventDocSummary } from '../models';
import { askEventDocGetByIdOrThrow } from './askEventDocGetByIdOrThrow';
import { askEventDocHookStates } from './askEventDocHookStates';

// The store's onPublish (for a Publish event) and onAppend hooks, after the write and outside the retry: a hook
// that throws Conflict must not re-run the append. `refolded` is the summary the append already brought up to
// date, so it is not read twice.
export function* askEventDocAppendHooksRun(modelId: string, event: EventDocEvent, refolded: Nullable<EventDocSummary>): AskResponse<void> {
  const { onPublish, onAppend } = yield* askEventDocStoreRead();
  const publishHook = event.type === EventDocEffect.Publish ? onPublish : undefined;

  if (!publishHook && !onAppend) {
    return;
  }

  const summary = refolded ?? (yield* askEventDocGetByIdOrThrow(modelId));
  const { state, previousState } = yield* askEventDocHookStates(modelId, event);

  if (publishHook) {
    yield* askInlineFunctionExecute<void, EventDocOnPublishInput>(publishHook, { docId: modelId, event, summary, state, previousState });
  }

  // onAppend runs after onPublish so it observes whatever read model onPublish just synced.
  if (onAppend) {
    yield* askInlineFunctionExecute<void, EventDocOnAppendInput>(onAppend, { docId: modelId, event, summary, state, previousState });
  }
}
