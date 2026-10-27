import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { ResolvedDevServerConfig } from '../../../types';
import { getCryptoDecryptActionProcessor } from './getCryptoDecryptActionProcessor';
import { getCryptoEncryptActionProcessor } from './getCryptoEncryptActionProcessor';
import { getCryptoGetPublicKeyActionProcessor } from './getCryptoGetPublicKeyActionProcessor';
import { getCryptoSignActionProcessor } from './getCryptoSignActionProcessor';
import { getCryptoVerifyActionProcessor } from './getCryptoVerifyActionProcessor';

export const getCryptoActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getCryptoEncryptActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getCryptoDecryptActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getCryptoSignActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getCryptoVerifyActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getCryptoGetPublicKeyActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
  });
