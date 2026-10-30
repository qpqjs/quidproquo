import { awsLambdaUtils } from '@qpqjs/actionprocessor-aws';
import { actionResult, actionResultError, askEventMatchStoryBase, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQConfig } from '@qpqjs/core';
import { qpqWebServerUtils, RouteQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { InternalEventRecord, MatchResult } from './types';

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

      // TODO: @joe-coady: Make this aware of the API that we are eventing
      config: qpqWebServerUtils.mergeAllRouteOptions('api', matchedRoute.route, qpqConfig),
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
