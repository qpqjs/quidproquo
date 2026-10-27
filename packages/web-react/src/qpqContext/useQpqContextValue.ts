import { QpqContextIdentifier } from 'quidproquo-core';

import { useQpqContextValues } from './useQpqContextValues';

export const useQpqContextValue = <T>(contextIdentifier: QpqContextIdentifier<T>): T => {
  const context = useQpqContextValues();

  return contextIdentifier.uniqueName in context ? context[contextIdentifier.uniqueName] : contextIdentifier.defaultValue;
};
