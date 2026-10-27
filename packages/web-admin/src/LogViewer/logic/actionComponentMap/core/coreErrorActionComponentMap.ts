import { ErrorActionType } from 'quidproquo-core';

const coreErrorActionComponentMap: Record<string, string[]> = {
  [ErrorActionType.ThrowError]: ['askThrowError', 'errorType', 'errorText', 'errorStack'],
};

export default coreErrorActionComponentMap;
