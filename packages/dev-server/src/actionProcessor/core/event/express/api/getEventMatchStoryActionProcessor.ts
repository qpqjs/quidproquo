import { awsLambdaUtils } from 'quidproquo-actionprocessor-awslambda';
import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';
import { qpqWebServerUtils, RouteQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { EventInput, InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const routes: RouteQPQWebServerConfigSetting[] = qpqWebServerUtils.getAllRoutes(qpqConfig);

  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    // The shared helper, so local matching agrees with lambda's.
    const matchedRoute = awsLambdaUtils.findApiRoute(routes, qpqEventRecord.method, qpqEventRecord.path);

    if (!matchedRoute) {
      return actionResultError(
        ErrorTypeEnum.NotFound,
        `route not found [${qpqEventRecord.path}] - [${qpqWebServerUtils.getHeaderValue('user-agent', qpqEventRecord.headers)}]`,
      );
    }

    return actionResult<MatchResult>({
      runtime: matchedRoute.route.runtime,
      runtimeOptions: matchedRoute.match.params || {},

      // TODO: Make this aware of the API that we are eventing
      config: qpqWebServerUtils.mergeAllRouteOptions('api', matchedRoute.route, qpqConfig),
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
