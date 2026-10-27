import { getS3Event_fileEvent } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const s3Event_fileEvent = getS3Event_fileEvent(dynamicModuleLoader, getQpqConfig());
