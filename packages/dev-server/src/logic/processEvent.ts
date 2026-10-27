import { getCustomActionActionProcessor } from 'quidproquo-actionprocessor-js';
import {
  ActionProcessorListResolver,
  askProcessEvent,
  createRuntime,
  DynamicModuleLoader,
  QPQConfig,
  qpqCoreUtils,
  QpqRuntimeType,
  StoryResult,
  StorySession,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { getDevServerActionProcessors, getExpressApiEventEventProcessor } from '../actionProcessor';
import { getDevServerLogger } from '../implementations/logger';
import { ResolvedDevServerConfig } from '../types';
import { withProcessorDelay } from './withProcessorDelay';

// TODO: Make this a util or something based on server time or something..
const getDateNow = () => new Date().toISOString();

export const processEvent = async <E, ER>(
  expressEvent: E,
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
  getActionProcessors: ActionProcessorListResolver,
  qpqRuntimeType: QpqRuntimeType,
  getStorySession: (event: E) => StorySession,
  devServerConfig: ResolvedDevServerConfig,
): Promise<StoryResult<[E], ER>> => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  const storySession = getStorySession(expressEvent);
  const logger = getDevServerLogger(qpqConfig, devServerConfig, storySession);

  const resolveStory = createRuntime(
    qpqConfig,
    storySession,
    async () =>
      withProcessorDelay(
        {
          ...(await getDevServerActionProcessors(qpqConfig, dynamicModuleLoader, devServerConfig)),
          ...(await getActionProcessors(qpqConfig, dynamicModuleLoader)),

          // Always done last, so they can ovveride the default ones if the user wants.
          ...(await getCustomActionActionProcessor(qpqConfig, dynamicModuleLoader)),
        },
        devServerConfig.delay,
      ),
    getDateNow,
    logger,
    `${serviceName}::${randomUUID()}`,
    qpqRuntimeType,
    dynamicModuleLoader,
    undefined,
    [],
  );

  const result = await resolveStory<[E]>(askProcessEvent, [expressEvent]);

  await logger.waitToFinishWriting();

  return result;
};
