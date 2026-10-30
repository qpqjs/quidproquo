import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';
import { askWebEntryInvalidateCache } from '@qpqjs/webserver';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { invalidateCache } from '../../../logic/cloudFront/invalidateCache';

const getProcessInvalidateCache = (qpqConfig: QPQConfig): ProcessorFor<typeof askWebEntryInvalidateCache> => {
  return async ({ paths, webEntryName }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const distributionId = await getExportedValue(awsNamingUtils.getCFExportNameDistributionIdArnFromConfig(webEntryName, qpqConfig), region);

    await invalidateCache(distributionId, region, paths);

    return actionResult(undefined);
  };
};

export const getWebEntryInvalidateCacheActionProcessor = createActionProcessor(askWebEntryInvalidateCache, getProcessInvalidateCache);
