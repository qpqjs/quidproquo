import { getEventBridgeEvent_stackDeploy } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const eventBridgeEvent_stackDeploy = getEventBridgeEvent_stackDeploy(dynamicModuleLoader, getQpqConfig());
