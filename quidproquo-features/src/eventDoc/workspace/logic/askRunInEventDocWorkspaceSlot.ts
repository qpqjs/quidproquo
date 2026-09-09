import { ActionOf, askOverrideActions, AskResponse, AskResponseReturnType, getSuccessfulEitherActionResultIfRequired } from 'quidproquo-core';

import {
  askApplyEventDocEventBase,
  askApplyTransientEventDocEventBase,
  askEventDocReadIdentity,
  askEventDocReadState,
  EventDocActionType,
} from '../../actions';
import { EventDocWorkspaceSlotBinding } from '../types/EventDocWorkspaceSlotBinding';
import { askEventDocWorkspaceCommitEvent } from './askEventDocWorkspaceCommitEvent';
import { askEventDocWorkspaceCommitTransientEvent } from './askEventDocWorkspaceCommitTransientEvent';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';

// Consumes the action, so an outer bind never sees an inner bind's commits: innermost wins.
const getApplyEventOverride = (binding: EventDocWorkspaceSlotBinding) =>
  function* overrideApplyEvent(action: ActionOf<typeof askApplyEventDocEventBase>): AskResponse<unknown> {
    // The requester always builds a payload; a missing one is a malformed action and safe to ignore.
    if (action.payload) {
      yield* askEventDocWorkspaceCommitEvent(binding, action.payload);
    }

    return getSuccessfulEitherActionResultIfRequired(undefined, action.returnErrors);
  };

const getApplyTransientEventOverride = (binding: EventDocWorkspaceSlotBinding) =>
  function* overrideApplyTransientEvent(action: ActionOf<typeof askApplyTransientEventDocEventBase>): AskResponse<unknown> {
    if (action.payload) {
      yield* askEventDocWorkspaceCommitTransientEvent(binding, action.payload);
    }

    return getSuccessfulEitherActionResultIfRequired(undefined, action.returnErrors);
  };

// The apply override dispatches before returning, so a read after a commit in the same story sees its own write.
const getReadStateOverride = (binding: EventDocWorkspaceSlotBinding) =>
  function* overrideReadState(action: ActionOf<typeof askEventDocReadState>): AskResponse<unknown> {
    const state = yield* askEventDocWorkspaceReadState();

    return getSuccessfulEitherActionResultIfRequired(binding.getView(state), action.returnErrors);
  };

const getReadIdentityOverride = (binding: EventDocWorkspaceSlotBinding) =>
  function* overrideReadIdentity(action: ActionOf<typeof askEventDocReadIdentity>): AskResponse<unknown> {
    const state = yield* askEventDocWorkspaceReadState();

    return getSuccessfulEitherActionResultIfRequired(state.slots[binding.slotKey]?.documentIdentity ?? null, action.returnErrors);
  };

/** Runs a story with every eventDoc action it yields (however nested, including parallel batches) routed into the bound slot. */
export function* askRunInEventDocWorkspaceSlot<T extends AskResponse<any>>(
  binding: EventDocWorkspaceSlotBinding,
  storyIterator: T,
): AskResponse<AskResponseReturnType<T>> {
  return yield* askOverrideActions(storyIterator, {
    [EventDocActionType.ApplyEvent]: getApplyEventOverride(binding),
    [EventDocActionType.ApplyTransientEvent]: getApplyTransientEventOverride(binding),
    [EventDocActionType.ReadState]: getReadStateOverride(binding),
    [EventDocActionType.ReadIdentity]: getReadIdentityOverride(binding),
  });
}
