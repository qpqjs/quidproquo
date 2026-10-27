import {
  actionResult,
  ApplicationConfigInfo,
  askConfigGetApplicationInfo,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from 'quidproquo-core';

const getProcessConfigGetApplicationConfig = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetApplicationInfo> => {
  return async () => {
    const appInfo: ApplicationConfigInfo = {
      environment: qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
      feature: qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
      module: qpqCoreUtils.getApplicationModuleName(qpqConfig),
      name: qpqCoreUtils.getApplicationName(qpqConfig),
    };

    return actionResult(appInfo);
  };
};

export const getConfigGetApplicationInfoActionProcessor = createActionProcessor(askConfigGetApplicationInfo, getProcessConfigGetApplicationConfig);
