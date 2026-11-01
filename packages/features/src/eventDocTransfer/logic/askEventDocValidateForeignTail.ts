import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller, ErrorTypeEnum } from '@qpqjs/core';

import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { askEventDocStoreReadOrThrow } from '../../eventDoc/context';
import { askEventDocEventListAll } from '../../eventDoc/data';
import { EventDocInvokableFunctions } from '../../eventDoc/definition/types/EventDocInvokableFunctions';
import { askEventDocValidateAppendRun } from '../../eventDoc/logic/askEventDocValidateAppendRun';
import { isEventDocFunctionsMissing } from '../../eventDoc/logic/isEventDocFunctionsMissing';
import { EventDocEffect, EventDocEvent } from '../../eventDoc/models';

// The prefix the tail must follow. For a new doc that is the bundle's opening INIT_STATE, which seeds the state like a
// create does. Otherwise it is the target's own stored log: the fast-forward match is by event identity, not data, so a
// bundle's copy of the prefix is not trusted to fold to the state the real document holds.
function* askEventDocReadForeignPrefix(
  docId: string,
  events: EventDocEvent[],
  fromIndex: number,
  storedPrefix?: EventDocEvent[],
): AskResponse<EventDocEvent[]> {
  if (fromIndex === 0) {
    if (events[0]?.type !== EventDocEffect.InitState) {
      return yield* askThrowError(
        ErrorTypeEnum.Invalid,
        `A bundle doc must open with ${EventDocEffect.InitState}, got [${events[0]?.type ?? 'nothing'}].`,
      );
    }

    return events.slice(0, 1);
  }

  const stored = storedPrefix ?? (yield* askEventDocEventListAll(docId, { consistentRead: true }));

  if (stored.length < fromIndex) {
    return yield* askThrowError(
      ErrorTypeEnum.Conflict,
      `The document's log changed during the import: ${stored.length} events stored, ${fromIndex} expected.`,
    );
  }

  return stored.slice(0, fromIndex);
}

/**
 * The uploader is the bundle's only provenance, so the tail gets the append gate's validator and fold, each event
 * against the state its predecessors fold to. The run starts after the prefix (see askEventDocReadForeignPrefix).
 * A collection with no registered definition degrades to an unvalidated write, as an append does. `storedPrefix` lets a
 * caller that already holds the target's log (a forced overwrite, before it cuts that log) validate without a read.
 * Requires the store context.
 */
export function* askEventDocValidateForeignTail(
  docId: string,
  events: EventDocEvent[],
  fromIndex: number,
  storedPrefix?: EventDocEvent[],
): AskResponse<void> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const seedCount = Math.max(fromIndex, 1);
  const prefix = yield* askEventDocReadForeignPrefix(docId, events, fromIndex, storedPrefix);
  const seed = yield* askCatch(functionsCaller.foldDocumentState(prefix));

  if (!seed.success) {
    if (isEventDocFunctionsMissing(seed.error.errorType)) {
      return;
    }

    // The bundle's own opening event is uploader input, so a fold that cannot read it is refused as Invalid, the
    // way the append gate refuses an unreadable event. A stored prefix that fails is the target's problem, not the bundle's.
    if (fromIndex === 0) {
      return yield* askThrowError(
        ErrorTypeEnum.Invalid,
        `Refusing to import an opening event the document fold cannot read (it would be stored permanently and make the document unreadable): ${seed.error.errorText}`,
      );
    }

    return yield* askThrowError(seed.error.errorType, seed.error.errorText);
  }

  yield* askEventDocValidateAppendRun(events.slice(seedCount), seed.result);
}
