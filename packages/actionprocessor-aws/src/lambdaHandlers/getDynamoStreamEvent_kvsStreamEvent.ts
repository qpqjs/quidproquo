import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { DynamoDBStreamEvent } from 'aws-lambda';

import { getDynamoKvsStreamEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getLambdaEnvironment, requireLambdaEnvironment } from './helpers/getLambdaEnvironment';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getDynamoStreamEvent_kvsStreamEvent = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<DynamoDBStreamEvent>(
    QpqRuntimeType.KVS_STREAM_EVENT,
    getBlankStorySession,
    getDynamoKvsStreamEventProcessor({ keyValueStoreName: requireLambdaEnvironment('keyValueStoreName'), ...getLambdaEnvironment().kvsStream }),
    dynamicModuleLoader,
    qpqConfig,
  );
