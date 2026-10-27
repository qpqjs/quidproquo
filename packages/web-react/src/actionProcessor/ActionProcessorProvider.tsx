import { ActionProcessorListResolver } from 'quidproquo-core';

import { useContext } from 'react';

import { ActionProcessorContext } from './ActionProcessorContext';

export type ActionProcessorProviderProps = {
  children: React.ReactNode;
  getActionProcessors: ActionProcessorListResolver;
};

export const ActionProcessorProvider: React.FC<ActionProcessorProviderProps> = ({ children, getActionProcessors }) => {
  const parentGetActionProcessors = useContext(ActionProcessorContext);

  // Merge: parent processors first, then this provider's (so child overrides parent)
  const mergedGetActionProcessors: ActionProcessorListResolver = async (qpqConfig, dynamicModuleLoader) => ({
    ...(await parentGetActionProcessors(qpqConfig, dynamicModuleLoader)),
    ...(await getActionProcessors(qpqConfig, dynamicModuleLoader)),
  });

  return <ActionProcessorContext.Provider value={mergedGetActionProcessors}>{children}</ActionProcessorContext.Provider>;
};
