import { Nullable, QPQConfig, qpqCoreUtils, QpqFunctionRuntime, QpqRuntimeType } from 'quidproquo-core';
import { ServiceFunctionActionType } from 'quidproquo-webserver';

import { getNodeServiceFunctionEventProcessor } from '../actionProcessor';
import { AnyExecuteServiceFunctionEventWithSession } from '../actionProcessor/core/event/node/serviceFunction/types';
import { eventBus, processEvent } from '../logic';
import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../types';

const getDynamicModuleLoader = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return async (runtime: QpqFunctionRuntime): Promise<any> => devServerConfig.dynamicModuleLoader(serviceName, runtime);
};

export const serviceFunctionImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<Nullable<DevServerPluginStop>> => {
  eventBus.on(ServiceFunctionActionType.Execute, async (payload: AnyExecuteServiceFunctionEventWithSession, correlation: string) => {
    // We need to find the qpqConfig for this service.
    const qpqConfig = devServerConfig.qpqConfigs.find((qpqConfig) => qpqCoreUtils.getApplicationModuleName(qpqConfig) === payload.serviceName);

    const eventPromise = await processEvent<AnyExecuteServiceFunctionEventWithSession, any>(
      payload,
      qpqConfig!,
      getDynamicModuleLoader(qpqConfig!, devServerConfig),
      getNodeServiceFunctionEventProcessor,
      QpqRuntimeType.SERVICE_FUNCTION_EXE,
      (e: AnyExecuteServiceFunctionEventWithSession) => e.storySession,
      devServerConfig,
    );

    if (correlation) {
      // Emit the response back on the unique responseEvent channel
      eventBus.emit(correlation, eventPromise);
    }
  });

  // A listener only: the executions it starts are in-flight work, drained by
  // the in-flight plugin.
  return null;
};
