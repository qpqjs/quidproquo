import { actionSearchRegistry } from 'quidproquo-features';

import { useMemo } from 'react';

import { ActionSearchView } from '../types/ActionSearchView';

const buildViews = (): ActionSearchView[] => {
  const views: ActionSearchView[] = [];

  // Definitions can share an entity (e.g. email send + status updates); one view each
  const seenEntityTypes = new Set<string>();

  for (const definition of actionSearchRegistry) {
    views.push({
      kind: 'action',
      key: definition.action.actionType,
      viewName: definition.action.viewName,
      fields: definition.action.fields,
    });

    if (definition.entity && !seenEntityTypes.has(definition.entity.entityType)) {
      seenEntityTypes.add(definition.entity.entityType);

      views.push({
        kind: 'entity',
        key: definition.entity.entityType,
        viewName: definition.entity.viewName,
        fields: definition.entity.fields,
      });
    }
  }

  return views;
};

export const useActionSearchViews = (): ActionSearchView[] => useMemo(buildViews, []);
