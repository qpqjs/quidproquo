import {
  getDateActionProcessor,
  getErrorActionProcessor,
  getGuidActionProcessor,
  getLogActionProcessor,
  getMathActionProcessor,
  getNetworkActionProcessor,
} from 'quidproquo-actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

/**
 * The whole world of a sandboxed user script: the pure processors (date, error, guid, log,
 * math) plus outbound network requests, which reach nothing of the service's own because
 * the runner has no credentials to sign with. Anything else a script yields has no
 * processor and fails, which is the sandbox's first wall; the runner's empty IAM role is
 * the second. Never merged into a host runtime's list.
 */
export const getUserScriptRunnerActionProcessors: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getDateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getErrorActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getGuidActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getMathActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getNetworkActionProcessor(qpqConfig, dynamicModuleLoader)),
});
