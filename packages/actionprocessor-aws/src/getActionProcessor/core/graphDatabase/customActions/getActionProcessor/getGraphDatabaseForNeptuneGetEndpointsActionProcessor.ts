import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { actionResult, actionResultErrorFromCaughtError, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { getConfigRuntimeResourceNameFromConfig } from '../../../../../awsNamingUtils';
import { getNeptuneEndpoints } from '../../../../../logic/neptune';
import { askGraphDatabaseForNeptuneGetEndpoints } from '../actions';

const getProcessGetEndpoints = (qpqConfig: QPQConfig): ProcessorFor<typeof askGraphDatabaseForNeptuneGetEndpoints> => {
  return async ({ graphDatabaseName }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const databaseName = getConfigRuntimeResourceNameFromConfig(graphDatabaseName, qpqConfig);

    try {
      const endpoints = await getNeptuneEndpoints(databaseName, region);

      return actionResult(endpoints);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getGraphDatabaseForNeptuneGetEndpointsActionProcessor = createActionProcessor(
  askGraphDatabaseForNeptuneGetEndpoints,
  getProcessGetEndpoints,
);
