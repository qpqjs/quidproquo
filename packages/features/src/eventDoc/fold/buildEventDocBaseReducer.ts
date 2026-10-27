import { buildEffectReducer, QpqReducer } from 'quidproquo-core';

import { EventDocDocument, EventDocEffect } from '../models';
import { createDraft } from './stateUpdaters/createDraft';
import { deleteDocument } from './stateUpdaters/deleteDocument';
import { initState } from './stateUpdaters/initState';
import { publish } from './stateUpdaters/publish';
import { restoreDocument } from './stateUpdaters/restoreDocument';
import { setCode } from './stateUpdaters/setCode';
import { setName } from './stateUpdaters/setName';
import { ReservedEventDocEffects } from './ReservedEventDocEffects';

/** The reserved effects every fold reducer carries, one pure state updater per effect. */
export const buildEventDocBaseReducer = <TState extends EventDocDocument>(
  getInitialState: () => TState,
): QpqReducer<TState, ReservedEventDocEffects> =>
  buildEffectReducer<TState, ReservedEventDocEffects>({
    [EventDocEffect.InitState]: initState(getInitialState),
    [EventDocEffect.SetCode]: setCode,
    [EventDocEffect.SetName]: setName,
    [EventDocEffect.CreateDraft]: createDraft,
    [EventDocEffect.Publish]: publish,
    [EventDocEffect.Delete]: deleteDocument,
    [EventDocEffect.Restore]: restoreDocument,
  });
