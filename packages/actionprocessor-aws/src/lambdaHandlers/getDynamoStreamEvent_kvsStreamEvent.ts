import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { DynamoDBStreamEvent } from 'aws-lambda';

import { getDynamoKvsStreamEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getLambdaEnvironment } from './helpers/getLambdaEnvironment';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';
import { requireLambdaEnvironment } from './helpers/requireLambdaEnvironment';

export const getDynamoStreamEvent_kvsStreamEvent = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<DynamoDBStreamEvent>(
    QpqRuntimeType.KVS_STREAM_EVENT,
    getBlankStorySession,
    getDynamoKvsStreamEventProcessor({ keyValueStoreName: requireLambdaEnvironment('keyValueStoreName'), ...getLambdaEnvironment().kvsStream }),
    dynamicModuleLoader,
    qpqConfig,
  );
