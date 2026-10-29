import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  createActionProcessor,
  EitherActionResult,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  StorySession,
  toCrossServiceSession,
} from '@qpqjs/core';
import { askServiceFunctionExecuteBase, ExecuteServiceFunctionEvent, ServiceFunctionActionType } from '@qpqjs/webserver';

import { getConfigRuntimeResourceName } from '../../../awsNamingUtils';
import { executeLambdaByName } from '../../../logic/lambda/executeLambdaByName';

// `any` here is a variance boundary: this processor forwards whatever payload/result
// types the calling story used, so it cannot name them without over-constraining.
type AnyExecuteServiceFunctionEventWithSession = ExecuteServiceFunctionEvent<any[]> & {
  storySession: StorySession;
};

const getProcessExecute = (qpqConfig: QPQConfig): ProcessorFor<typeof askServiceFunctionExecuteBase> => {
  return async ({ functionName, service, payload, isAsync }, session) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const appName = qpqCoreUtils.getApplicationName(qpqConfig);
    const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
    const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

    const awsFunctionName = getConfigRuntimeResourceName(`${functionName}-sfunc`, appName, service, environment, feature);

    const serviceFunctionEvent: AnyExecuteServiceFunctionEventWithSession = {
      functionName: functionName,
      payload: payload as any[],
      storySession: toCrossServiceSession(session),
    };

    const result = await executeLambdaByName<EitherActionResult<any>>(awsFunctionName, region, serviceFunctionEvent, isAsync);

    if (!result) {
      return actionResult(undefined);
    }

    if (!result.success) {
      return actionResultError(result.error.errorType, result.error.errorText, `${service}::${functionName}: ${result?.error.errorStack || ''}`);
    }

    return actionResult(result.result);
  };
};

export const getServiceFunctionExecuteActionProcessor = createActionProcessor(askServiceFunctionExecuteBase, getProcessExecute);
