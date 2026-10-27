import { buildEffectReducer, combineQpqReducers, QpqReducer } from 'quidproquo-core';

import { EventDocDocument } from '../models';
import { buildEventDocBaseReducer } from './buildEventDocBaseReducer';
import { EffectHandlers } from './EffectHandlers';
import { ReservedEventDocEffects } from './ReservedEventDocEffects';

/** A module's domain handlers combined with the reserved base effects, typed so folding a full log type-checks. */
export const buildEventDocFoldReducer = <TState extends EventDocDocument, TDomainEffect extends { type: string; payload: unknown }>(
  getInitialState: () => TState,
  handlers: EffectHandlers<TState, TDomainEffect>,
): QpqReducer<TState, TDomainEffect | ReservedEventDocEffects> =>
  combineQpqReducers(buildEventDocBaseReducer<TState>(getInitialState), buildEffectReducer<TState, TDomainEffect>(handlers));
