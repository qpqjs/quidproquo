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
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { matchUrl } from '../../../../awsLambdaUtils';
import { EventInput, InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const seoConfigs = qpqWebServerUtils.getAllSeo(qpqConfig);

  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    // Sort the routes by string length
    // we don't sort them here for SEO... its the order they are defined.
    const sortedSeoConfigs = seoConfigs; // qpqWebServerUtils.sortPathMatchConfigs(seoConfigs);

    // Find the most relevant match
    const matchedSeoConfig = sortedSeoConfigs
      .map((r) => ({
        match: matchUrl(r.path, qpqEventRecord.path),
        route: r,
      }))
      .find((m) => m.match.didMatch);

    if (!matchedSeoConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `seo not found [${qpqEventRecord.path}]`);
    }

    return actionResult<MatchResult>({
      runtime: matchedSeoConfig.route.runtime,
      runtimeOptions: matchedSeoConfig.match.params || {},
      config: matchedSeoConfig.route,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
