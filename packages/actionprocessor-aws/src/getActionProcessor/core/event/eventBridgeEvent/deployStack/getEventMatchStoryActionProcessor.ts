import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  EventActionType,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from 'quidproquo-core';

import { EventInput, InternalEventRecord, MatchResult } from './types';

// TODO: Globals? Are these bad....
const GLOBAL_DEPLOY_EVENT_NAME = process.env.deployEventConfigName!;

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const deployConfig = qpqCoreUtils.getDeployEventConfigs(qpqConfig).find((c) => c.name === GLOBAL_DEPLOY_EVENT_NAME);

  return async ({ qpqEventRecord }) => {
    if (!deployConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `Could not find deploy event config ${GLOBAL_DEPLOY_EVENT_NAME}`);
    }

    return actionResult<MatchResult>({
      runtime: deployConfig.runtime,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
