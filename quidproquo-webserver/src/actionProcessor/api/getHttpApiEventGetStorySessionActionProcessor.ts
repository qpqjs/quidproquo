import {
  actionResult,
  askEventGetStorySessionBase,
  createActionProcessor,
  EventActionType,
  generateUuid,
  getProcessCustomImplementation,
  MatchStoryResult,
  mergeRuntimeActionProcessors,
  ProcessorFor,
  QPQConfig,
  StorySession,
} from 'quidproquo-core';

import { RouteOptions } from '../../config/settings/route';
import { askGetHttpApiEventStorySession, GetHttpApiEventStorySessionPayload } from '../../stories/askGetHttpApiEventStorySession';
import { HTTPEvent } from '../../types/HTTPEvent';

type InternalMatchResult = MatchStoryResult<any, RouteOptions>;

const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  const getSession = getProcessCustomImplementation<any>(
    qpqConfig,
    askGetHttpApiEventStorySession,
    'API Get Story Session',
    null,
    () => new Date().toISOString(),
    generateUuid,
  );

  return async ({ matchStoryResult, qpqEventRecord }, session, actionProcessorList, logger, updateSession, dynamicModuleLoader) => {
    const payload: GetHttpApiEventStorySessionPayload = {
      // Registered only for the http api event source, so the base's source-agnostic
      // record is an HTTPEvent here.
      event: qpqEventRecord as HTTPEvent,
      routeAuthSettings: matchStoryResult.config?.routeAuthSettings,
      session,
    };

    // Same merge as the auto-respond preamble: the session-seeding decode must
    // also see the matched route's processor overrides, or a custom validator's
    // decoded identity would never reach the story session.
    const mergedActionProcessorList = await mergeRuntimeActionProcessors(
      qpqConfig,
      matchStoryResult.runtime,
      actionProcessorList,
      dynamicModuleLoader,
    );

    const [storySession, error] = await getSession(payload, session, mergedActionProcessorList, logger, updateSession, dynamicModuleLoader);

    if (error) {
      return actionResult(void 0);
    }

    return actionResult(storySession);
  };
};

export const getHttpApiEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
