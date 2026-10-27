import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from 'quidproquo-core';

import { EventBridgeEvent } from 'aws-lambda';

import { getEventBridgeEventActionProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getEventBridgeEvent_recurringSchedule = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<EventBridgeEvent<string, void>>(
    QpqRuntimeType.RECURRING_SCHEDULE,
    getBlankStorySession,
    // TODO: rename this to something recurring-schedule specific.
    getEventBridgeEventActionProcessor,
    dynamicModuleLoader,
    qpqConfig,
  );
