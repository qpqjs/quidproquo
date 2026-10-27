import { ContextActionType } from 'quidproquo-core';

const coreContextActionComponentMap: Record<string, string[]> = {
  [ContextActionType.Read]: ['askContextRead', 'contextIdentifier'],
};

export default coreContextActionComponentMap;
