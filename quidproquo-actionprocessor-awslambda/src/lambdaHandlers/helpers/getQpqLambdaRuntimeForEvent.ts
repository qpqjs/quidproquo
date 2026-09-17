import { getCustomActionActionProcessor } from 'quidproquo-actionprocessor-js';
import {
  ActionProcessorList,
  ActionProcessorListResolver,
  askProcessEvent,
  createRuntime,
  DynamicModuleLoader,
  QPQConfig,
  QpqRuntimeType,
  StorySession,
} from 'quidproquo-core';

import { Context, SNSEvent } from 'aws-lambda';

import { getAwsActionProcessors } from '../../getActionProcessor';
import { QpqFunctionExecutionEvent } from '../types';
import { dynamicModuleLoaderWarmer } from './dynamicModuleLoaderWarmer';
import { getLambdaRuntimeRemainingTimeActionProcessor } from './getLambdaRuntimeRemainingTimeActionProcessor';
import { getLogger } from './getLogger';
import { getRuntimeCorrelation } from './getRuntimeCorrelation';
import { isSnsWarmerRecord } from './isSnsWarmerRecord';

// SQS/S3/CloudFront events also have a Records array, so this matches more than
// real SNS events. That is harmless: the warmer scan below only acts on records
// whose EventSource is 'aws:sns', everything else falls through to processEvent.
const isSnsEvent = <T>(event: QpqFunctionExecutionEvent<T>): event is SNSEvent => {
  if (event && typeof event === 'object') {
    const possibleSnsEvent = event as unknown as SNSEvent;
    return possibleSnsEvent.Records && Array.isArray(possibleSnsEvent.Records);
  }

  return false;
};

/**
 * Builds the shared lambda handler: wires a qpq runtime for the event type,
 * short-circuits SNS warmer pings, runs the process-event story and ships logs.
 */
export const getQpqLambdaRuntimeForEvent = <E extends QpqFunctionExecutionEvent<any>>(
  runtimeType: QpqRuntimeType,
  getStorySession: (event: E) => StorySession,
  getActionProcessorList: ActionProcessorListResolver,
  dynamicModuleLoader: DynamicModuleLoader,
  qpqConfig: QPQConfig,
  getProcessEventStory: () => typeof askProcessEvent = () => askProcessEvent,
) => {
  // Built per invoke: the lambda context (and so the execution deadline) is not
  // known until the handler runs.
  const getResolveActionProcessorList = (context: Context) => async (): Promise<ActionProcessorList> => ({
    ...(await getAwsActionProcessors(qpqConfig, dynamicModuleLoader)),
    ...(await getActionProcessorList(qpqConfig, dynamicModuleLoader)),
    ...getLambdaRuntimeRemainingTimeActionProcessor(context),

    // Always done last, so they can override the default ones if the user wants.
    ...(await getCustomActionActionProcessor(qpqConfig, dynamicModuleLoader)),
  });

  return async (event: E, context: Context) => {
    console.log('tick: ', JSON.stringify(event, null, 2));

    const logger = getLogger(qpqConfig);

    const resolveStory = createRuntime(
      qpqConfig,
      getStorySession(event),
      getResolveActionProcessorList(context),
      () => new Date().toISOString(),
      logger,
      getRuntimeCorrelation(qpqConfig),
      runtimeType,
      dynamicModuleLoader,
    );

    const processEvent = async () => {
      const result = await resolveStory(getProcessEventStory(), [event, context]);
      await logger.waitToFinishWriting();

      if (result.error) {
        throw new Error(result.error.errorText);
      }

      console.log('Finished, returning: ', result.result);
      return result.result;
    };

    if (isSnsEvent(event)) {
      const recordsNoWarm = event.Records.filter((record) => !isSnsWarmerRecord(record));

      // A warmer ping arrives as its own single-record SNS event; any warmer
      // present means this invoke exists only to keep the sandbox warm.
      if (recordsNoWarm.length !== event.Records.length) {
        // TODO: Warm qpq things with dynamic functions
        // federate in dynamic modules
        await dynamicModuleLoaderWarmer();

        // Might as well move the logs to permanent storage
        await logger.moveToPermanentStorage();

        return 'Warmed up!';
      }
    }

    return await processEvent();
  };
};
