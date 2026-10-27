import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from 'quidproquo-core';

import { CloudFrontRequestEvent } from 'aws-lambda';

import { getCloudFrontOriginRequestEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getCloudFrontRequestEvent_originRequest = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<CloudFrontRequestEvent>(
    QpqRuntimeType.EVENT_SEO_OR,
    getBlankStorySession,
    getCloudFrontOriginRequestEventProcessor,
    dynamicModuleLoader,
    qpqConfig,
  );
