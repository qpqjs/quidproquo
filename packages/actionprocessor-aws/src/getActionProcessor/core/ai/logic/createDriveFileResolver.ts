import {
  ActionProcessorList,
  askFileReadBinaryContents,
  createImplementationRuntime,
  DynamicModuleLoader,
  QPQConfig,
  QpqLogger,
  StorySession,
  StreamRegistry,
} from 'quidproquo-core';

import { randomGuid } from '../../../../awsLambdaUtils';
import { AiDriveFileResolver } from './toSdkMessages';

// Reads drive-referenced files through the active file action processor, so the
// same message works against S3 in production and local disk under the dev server.
export const createDriveFileResolver = (
  qpqConfig: QPQConfig,
  session: StorySession,
  actionProcessorList: ActionProcessorList,
  logger: QpqLogger,
  dynamicModuleLoader: DynamicModuleLoader,
  streamRegistry?: StreamRegistry,
): AiDriveFileResolver => {
  return async (drive: string, filepath: string, scope?: string) => {
    const resolveStory = createImplementationRuntime(
      qpqConfig,
      [`AI File: ${drive}/${filepath}`],
      () => new Date().toISOString(),
      randomGuid,
      session,
      actionProcessorList,
      logger,
      dynamicModuleLoader,
      streamRegistry,
    );

    const storyResult = await resolveStory(askFileReadBinaryContents, [drive, filepath, scope]);

    if (storyResult.error) {
      throw new Error(storyResult.error.errorText);
    }

    return storyResult.result;
  };
};
