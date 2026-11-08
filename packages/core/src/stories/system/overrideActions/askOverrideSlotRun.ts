import { SystemActionType } from '../../../actions';
import { Action, AskResponse } from '../../../types';
import { ActionOverrideMap } from '../../../types/ActionOverrideMap';
import { askCatch } from '../askCatch';
import { AskOverrideSlot } from './AskOverrideSlot';
import { getOwnOverrideHandler } from './getOwnOverrideHandler';
import { OverrideBatchSlot } from './OverrideBatchSlot';

/**
 * Runs one batch slot here when an override claims it, or when it is itself a batch that may hold overridden
 * actions deeper inside; any other slot is left for the runtime batch. The run is wrapped in askCatch so a failing
 * sub-action becomes a captured failure for this slot instead of escaping bare and bypassing the enclosing batch's
 * returnErrors protection.
 */
export function* askOverrideSlotRun(
  batchAction: Action<any>,
  overrides: ActionOverrideMap,
  askOverrideSlot: AskOverrideSlot,
): AskResponse<OverrideBatchSlot> {
  const isOverridden = !!(getOwnOverrideHandler(overrides, batchAction.type) || getOwnOverrideHandler(overrides, '*'));
  const isBatch = batchAction.type === SystemActionType.Batch;
  const needsRecursion = isOverridden || isBatch;

  return {
    action: batchAction,
    alreadyProcessed: needsRecursion,
    result: needsRecursion ? yield* askCatch(askOverrideSlot(batchAction)) : undefined,
  };
}
