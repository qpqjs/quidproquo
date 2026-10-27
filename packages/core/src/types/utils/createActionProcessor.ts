import { QPQConfig } from '../../config';
import { ActionProcessorListResolver } from '../Action';
import { AnyActionRequesterFunction, ProcessorFor } from '../ActionRequesterFunction';
import { DynamicModuleLoader } from '../DynamicModuleLoader';

// Builds the single-entry processor map from the requester itself, so the registration
// key can never drift from the action type the requester yields, and the processor's
// payload and return types are checked against the requester's.
export const createActionProcessor =
  <TRequester extends AnyActionRequesterFunction>(
    requester: TRequester,
    getProcessor: (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader) => ProcessorFor<TRequester> | Promise<ProcessorFor<TRequester>>,
  ): ActionProcessorListResolver =>
  async (qpqConfig, dynamicModuleLoader) => ({
    [requester.actionType]: await getProcessor(qpqConfig, dynamicModuleLoader),
  });
