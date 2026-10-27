import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from 'quidproquo-core';

import { DynamoDBStreamEvent } from 'aws-lambda';

import { getDynamoKvsStreamEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getDynamoStreamEvent_kvsStreamEvent = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<DynamoDBStreamEvent>(
    QpqRuntimeType.KVS_STREAM_EVENT,
    getBlankStorySession,
    getDynamoKvsStreamEventProcessor,
    dynamicModuleLoader,
    qpqConfig,
  );
