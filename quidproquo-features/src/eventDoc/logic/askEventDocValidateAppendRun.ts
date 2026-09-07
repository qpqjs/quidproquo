import { AskResponse, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocEvent } from '../models';
import { askEventDocValidateAppend } from './askEventDocValidateAppend';

/**
 * The batch form of the pre-write gate: validate a RUN of events that will land
 * consecutively, each against the state its predecessors build. The first event is
 * checked against `state` (the document at the head the run follows); each accepted
 * event is then folded on through the collection's registered `foldDocumentState`, so
 * the next is judged as the fold will judge it. The first rejection throws Invalid and
 * nothing is written (the caller has not written yet).
 *
 * Costs a validator call and a single-event fold per event, which is why the batch
 * append only runs it when asked to (EventDocEventAppendOptions.validate).
 */
export function* askEventDocValidateAppendRun(events: EventDocEvent[], state: unknown): AskResponse<void> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  let current = state;

  for (const event of events) {
    yield* askEventDocValidateAppend(event, current);
    current = yield* functionsCaller.foldDocumentState([event], current);
  }
}
