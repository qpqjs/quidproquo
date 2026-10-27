import { QpqContextIdentifier } from 'quidproquo-core';

import { ReactNode, useContext, useMemo } from 'react';

import { qpqReactContext } from './qpqReactContext';

type QpqContextProviderProps<T> = {
  contextIdentifier: QpqContextIdentifier<T>; // Ensures the identifier carries the type of the value
  value: T; // The value must match the type expected by the identifier
  children: ReactNode;
};

export const QpqContextProvider = <T,>({ contextIdentifier, value, children }: QpqContextProviderProps<T>) => {
  // Get the parent context value
  const parentContext = useContext(qpqReactContext);

  // Merge parent and current value
  const mergedContext = useMemo(
    () => ({ ...parentContext, [contextIdentifier.uniqueName]: value }),
    [parentContext, contextIdentifier.uniqueName, value],
  );

  // Provide the merged context down
  return <qpqReactContext.Provider value={mergedContext}>{children}</qpqReactContext.Provider>;
};
