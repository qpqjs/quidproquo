import { getCloudFrontRequestEvent_originRequest } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const cloudFrontRequestEvent_originRequest = getCloudFrontRequestEvent_originRequest(dynamicModuleLoader, getQpqConfig());
