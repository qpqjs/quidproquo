import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { ResolvedDevServerConfig } from '../../../types';
import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreGetAllActionProcessor } from './getKeyValueStoreGetAllActionProcessor';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';
import { getKeyValueStoreScanActionProcessor } from './getKeyValueStoreScanActionProcessor';
import { getKeyValueStoreScanAllScopesActionProcessor } from './getKeyValueStoreScanAllScopesActionProcessor';
import { getKeyValueStoreUpdateActionProcessor } from './getKeyValueStoreUpdateActionProcessor';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';
import { getKeyValueStoreUpsertManyActionProcessor } from './getKeyValueStoreUpsertManyActionProcessor';

export const getKeyValueStoreActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => {
    return {
      ...(await getKeyValueStoreDeleteActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreGetActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreGetAllActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreQueryActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreScanActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreScanAllScopesActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreUpdateActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreUpsertActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
      ...(await getKeyValueStoreUpsertManyActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    };
  };
