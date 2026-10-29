import { QPQConfig } from '../config';
import { ActionProcessorList, ActionProcessorListResolver } from '../types/Action';
import { DynamicModuleLoader } from '../types/DynamicModuleLoader';

/**
 * Resolves each layer in order and merges them, a later layer overriding an earlier one. The one
 * ordering rule every host runtime composes with: the platform's processors first, the host's own
 * overrides on top, and the service's custom processors last so they can replace anything.
 */
export const composeActionProcessorLayers = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
  layers: ActionProcessorListResolver[],
): Promise<ActionProcessorList> => {
  let merged: ActionProcessorList = {};

  for (const layer of layers) {
    merged = { ...merged, ...(await layer(qpqConfig, dynamicModuleLoader)) };
  }

  return merged;
};
