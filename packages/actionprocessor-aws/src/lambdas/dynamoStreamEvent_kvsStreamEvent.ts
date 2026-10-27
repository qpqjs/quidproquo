import { getDynamoStreamEvent_kvsStreamEvent } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const dynamoStreamEvent_kvsStreamEvent = getDynamoStreamEvent_kvsStreamEvent(dynamicModuleLoader, getQpqConfig());
