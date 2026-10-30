import { getEventAutoRespondNoopActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig, QpqFunctionRuntime } from '@qpqjs/core';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

export const getS3FileEventEventProcessor =
  (storageDriveName: string, storageDriveRuntime: QpqFunctionRuntime): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getEventAutoRespondNoopActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetRecordsActionProcessor(storageDriveName)(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetStorySessionActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventMatchStoryActionProcessor(storageDriveRuntime)(qpqConfig, dynamicModuleLoader)),
    ...(await getEventTransformResponseResultActionProcessor(qpqConfig, dynamicModuleLoader)),
  });
