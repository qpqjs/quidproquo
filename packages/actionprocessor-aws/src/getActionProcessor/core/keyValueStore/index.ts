import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreGetAllActionProcessor } from './getKeyValueStoreGetAllActionProcessor';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';
import { getKeyValueStoreScanActionProcessor } from './getKeyValueStoreScanActionProcessor';
import { getKeyValueStoreScanAllScopesActionProcessor } from './getKeyValueStoreScanAllScopesActionProcessor';
import { getKeyValueStoreUpdateActionProcessor } from './getKeyValueStoreUpdateActionProcessor';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';
import { getKeyValueStoreUpsertManyActionProcessor } from './getKeyValueStoreUpsertManyActionProcessor';

export const getKeyValueStoreActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getKeyValueStoreDeleteActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreGetActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreGetAllActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreUpsertActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreUpsertManyActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreUpdateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreQueryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreScanActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreScanAllScopesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
