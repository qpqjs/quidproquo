import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { actionResult, createActionProcessor, ProcessorFor, QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { askWebEntryInvalidateCache, WebEntryActionType } from 'quidproquo-webserver';

import { getCFExportNameDistributionIdArnFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { invalidateCache } from '../../../logic/cloudFront/invalidateCache';

const getProcessInvalidateCache = (qpqConfig: QPQConfig): ProcessorFor<typeof askWebEntryInvalidateCache> => {
  return async ({ paths, webEntryName }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const distributionId = await getExportedValue(getCFExportNameDistributionIdArnFromConfig(webEntryName, qpqConfig), region);

    await invalidateCache(distributionId, region, paths);

    return actionResult(void 0);
  };
};

export const getWebEntryInvalidateCacheActionProcessor = createActionProcessor(askWebEntryInvalidateCache, getProcessInvalidateCache);
