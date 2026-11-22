import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getUserDirectorySetDecodedAccessTokenActionProcessor } from './getUserDirectorySetDecodedAccessTokenActionProcessor';

/** The user directory actions every runtime answers the same way; a runtime adds its own directory's on top. */
export const getUserDirectoryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserDirectorySetDecodedAccessTokenActionProcessor(qpqConfig, dynamicModuleLoader)),
});
