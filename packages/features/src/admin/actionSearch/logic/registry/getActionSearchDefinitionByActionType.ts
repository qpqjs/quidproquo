import { Nullable } from 'quidproquo-core';

import { ActionSearchDefinition } from '../../domain/ActionSearchDefinition';
import { actionSearchRegistry } from './actionSearchRegistry';

export const getActionSearchDefinitionByActionType = (actionType: string): Nullable<ActionSearchDefinition> =>
  actionSearchRegistry.find((definition) => definition.action.actionType === actionType) ?? null;
