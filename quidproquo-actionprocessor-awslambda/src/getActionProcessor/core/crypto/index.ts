import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getCryptoDecryptActionProcessor } from './getCryptoDecryptActionProcessor';
import { getCryptoEncryptActionProcessor } from './getCryptoEncryptActionProcessor';
import { getCryptoGetPublicKeyActionProcessor } from './getCryptoGetPublicKeyActionProcessor';
import { getCryptoSignActionProcessor } from './getCryptoSignActionProcessor';
import { getCryptoVerifyActionProcessor } from './getCryptoVerifyActionProcessor';

export const getCryptoActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getCryptoEncryptActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getCryptoDecryptActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getCryptoSignActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getCryptoVerifyActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getCryptoGetPublicKeyActionProcessor(qpqConfig, dynamicModuleLoader)),
});
