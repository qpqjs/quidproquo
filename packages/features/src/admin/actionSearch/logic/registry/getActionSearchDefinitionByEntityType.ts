import { Nullable } from '@qpqjs/core';

import { ActionSearchDefinition } from '../../domain/ActionSearchDefinition';
import { actionSearchRegistry } from './actionSearchRegistry';

export const getActionSearchDefinitionByEntityType = (entityType: string): Nullable<ActionSearchDefinition> =>
  actionSearchRegistry.find((definition) => definition.entity?.entityType === entityType) ?? null;
