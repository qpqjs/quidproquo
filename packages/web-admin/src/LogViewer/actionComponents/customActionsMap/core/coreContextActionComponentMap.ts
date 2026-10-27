import { ContextActionType } from 'quidproquo-core';

import { CoreContextListCustomAction } from '../../custom';
import { ActionComponent } from '../../types';

const coreContextActionComponentMap: Record<string, ActionComponent> = {
  [ContextActionType.List]: CoreContextListCustomAction,
};

export default coreContextActionComponentMap;
