import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

// Shared webserver processors (dns, ...) are owned by @qpqjs/actionprocessor-js and
// spread in by getWebActionProcessors. This aggregator holds only web-specific webserver
// processors (none yet).
export const getWebserverActionProcessor: ActionProcessorListResolver = async (
  _qpqConfig: QPQConfig,
  _dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({});
