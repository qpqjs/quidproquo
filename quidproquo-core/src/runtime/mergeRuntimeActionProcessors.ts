import { QPQConfig } from '../config';
import { ActionProcessorList } from '../types/Action';
import { DynamicModuleLoader } from '../types/DynamicModuleLoader';
import { QpqFunctionRuntime } from '../types/QpqFunctionRuntime';
import { getActionProcessorsFromQpqFunctionRuntime } from '../utils/path/getActionProcessorsFromQpqFunctionRuntime';
import { loadRuntimeActionProcessors } from './loadRuntimeActionProcessors';

// Merges a runtime's attached action processor overrides over a base list, last
// wins. The single merge implementation for every merge point: resolveStory for
// the story execution, and the http event processors that must see a matched
// route's overrides during the framework preamble (auth decode, session seeding).
export const mergeRuntimeActionProcessors = async (
  qpqConfig: QPQConfig,
  qpqFunctionRuntimeInfo: QpqFunctionRuntime | undefined,
  baseActionProcessors: ActionProcessorList,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => {
  const attachedSources = getActionProcessorsFromQpqFunctionRuntime(qpqFunctionRuntimeInfo);

  // The base list is returned as-is when nothing is attached: it may not be a plain
  // object (qpqExecuteLog replays through a Proxy, which a spread would flatten to
  // nothing).
  if (!attachedSources?.length) {
    return baseActionProcessors;
  }

  return {
    ...baseActionProcessors,
    ...(await loadRuntimeActionProcessors(qpqConfig, attachedSources, dynamicModuleLoader)),
  };
};
