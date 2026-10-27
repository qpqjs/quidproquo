import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getGuidNewActionProcessor } from './getGuidNewActionProcessor';
import { getGuidNewSortableActionProcessor } from './getGuidNewSortableActionProcessor';
import { getGuidNewSortableManyActionProcessor } from './getGuidNewSortableManyActionProcessor';

export const getGuidActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getGuidNewActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getGuidNewSortableActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getGuidNewSortableManyActionProcessor(qpqConfig, dynamicModuleLoader)),
});
