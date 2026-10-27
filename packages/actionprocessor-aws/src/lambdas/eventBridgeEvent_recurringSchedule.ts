import { getEventBridgeEvent_recurringSchedule } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const eventBridgeEvent_recurringSchedule = getEventBridgeEvent_recurringSchedule(dynamicModuleLoader, getQpqConfig());
