import { ContextActionType } from '@qpqjs/core';

const coreContextActionComponentMap: Record<string, string[]> = {
  [ContextActionType.Read]: ['askContextRead', 'contextIdentifier'],
};

export default coreContextActionComponentMap;
