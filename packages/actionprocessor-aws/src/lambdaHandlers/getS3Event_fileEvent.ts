import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { S3Event } from 'aws-lambda';

import { getS3FileEventEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getLambdaEnvironment, requireLambdaEnvironment } from './helpers/getLambdaEnvironment';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getS3Event_fileEvent = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<S3Event>(
    QpqRuntimeType.STORAGEDRIVE_EVENT,
    getBlankStorySession,
    getS3FileEventEventProcessor(requireLambdaEnvironment('storageDriveName'), getLambdaEnvironment().storageDriveRuntime),
    dynamicModuleLoader,
    qpqConfig,
  );
