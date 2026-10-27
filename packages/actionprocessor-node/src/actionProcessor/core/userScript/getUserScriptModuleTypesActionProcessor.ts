import {
  ActionProcessorList,
  actionResult,
  actionResultError,
  askUserScriptModuleTypes,
  createActionProcessor,
  DynamicModuleLoader,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  UserScriptModuleTypes,
} from '@qpqjs/core';

const { errorType } = askUserScriptModuleTypes;

const getProcessModuleTypes = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptModuleTypes> => {
  return async (
    _payload: undefined,
    _session,
    _actionProcessors: ActionProcessorList,
    _logger,
    _updateSession,
    dynamicModuleLoader: DynamicModuleLoader,
  ) => {
    const modules = qpqCoreUtils.getAllUserScriptModules(qpqConfig);
    const types: UserScriptModuleTypes[] = [];

    // Each types entry is an ordinary runtime the bundler answers with the declarations text,
    // so this works the same wherever the dynamic module loader runs.
    for (const { moduleName, typesRuntime } of modules) {
      if (!typesRuntime) {
        continue;
      }
      const declarations = await dynamicModuleLoader(typesRuntime);
      if (typeof declarations !== 'string') {
        return actionResultError(errorType.TypesNotFound, `User script module [${moduleName}] declared types, but they did not load as declarations`);
      }
      types.push({ moduleName, declarations });
    }

    return actionResult(types);
  };
};

export const getUserScriptModuleTypesActionProcessor = createActionProcessor(askUserScriptModuleTypes, getProcessModuleTypes);
