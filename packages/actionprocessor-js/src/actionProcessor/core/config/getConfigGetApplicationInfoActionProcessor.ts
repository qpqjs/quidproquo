import {
  actionResult,
  ApplicationConfigInfo,
  askConfigGetApplicationInfo,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';

const getProcessConfigGetApplicationInfo = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetApplicationInfo> => {
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

export const getConfigGetApplicationInfoActionProcessor = createActionProcessor(askConfigGetApplicationInfo, getProcessConfigGetApplicationInfo);
