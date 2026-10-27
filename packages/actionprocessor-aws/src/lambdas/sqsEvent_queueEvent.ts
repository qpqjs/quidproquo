import { getSqsEvent_queueEvent } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const sqsEvent_queueEvent = getSqsEvent_queueEvent(dynamicModuleLoader, getQpqConfig());
