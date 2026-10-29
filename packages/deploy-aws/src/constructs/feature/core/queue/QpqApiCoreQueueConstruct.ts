import { awsNamingUtils, clampToLambdaTimeout } from '@qpqjs/config-aws';
import { qpqCoreUtils, QueueQPQConfigSetting } from '@qpqjs/core';

import { aws_lambda_event_sources, aws_sns_subscriptions } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';
import { QpqCoreEventBusConstruct } from '../eventBus/QpqCoreEventBusConstruct';
import { QpqCoreQueueConstruct } from './QpqCoreQueueConstruct';

export type QpqApiCoreQueueConstructProps = {
  queueConfig: QueueQPQConfigSetting;
} & QpqConstructBlockProps;

export class QpqApiCoreQueueConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqApiCoreQueueConstructProps) {
    super(scope, id, props);

    const queueFunction = new Function(this, props.queueConfig.uniqueKey, {
      functionName: this.resourceName(awsNamingUtils.getLambdaBaseName(props.queueConfig.uniqueKey, awsNamingUtils.QpqLambdaKind.Queue)),
      handler: 'sqsEvent_queueEvent',

      qpqConfig: props.qpqConfig,

      environment: {
        // Just the name - the runtime resolves the full setting from the bundled
        // qpqConfig. Serializing the whole setting here blows the lambda 4KB
        // env limit once processors carry large globals (e.g. AI system prompts).
        queueName: props.queueConfig.name,
      },

      reservedConcurrentExecutions: props.queueConfig.maxConcurrentExecutions,

      // The consumer may run for the whole retry delay, up to lambda's ceiling. SQS requires the
      // queue's visibility timeout (the retry delay itself) to be at least this, or a message still
      // being processed would reappear and be consumed twice; a longer delay is fine.
      timeoutInSeconds: clampToLambdaTimeout(props.queueConfig.ttRetryInSeconds),

      role: this.getServiceRole(),
    });

    const queueResource = QpqCoreQueueConstruct.fromOtherStack(this, 'queue', props.qpqConfig, props.queueConfig);

    // Fails synth when a FIFO queue subscribes to a standard bus (AWS can't deliver those)
    qpqCoreUtils.assertFifoQueueEventBusSubscriptionsAreValid(props.qpqConfig);

    props.queueConfig.eventBusSubscriptions.forEach((eventBusSubscription) => {
      const eventBus = QpqCoreEventBusConstruct.fromOtherStack(this, `event-bus-${eventBusSubscription}`, props.qpqConfig, eventBusSubscription);

      eventBus.topic.addSubscription(
        new aws_sns_subscriptions.SqsSubscription(queueResource.queue, {
          rawMessageDelivery: true,

          // No wildcard support :(
          // filterPolicy: {
          //   type: aws_sns.SubscriptionFilter.stringFilter({
          //     allowlist: Object.keys(props.queueConfig.qpqQueueProcessors).map((type) =>
          //       type.replaceAll(/{(.+?)}/g, '*'),
          //     ),
          //   }),
          // },
        }),
      );
    });

    const eventSourceOptions: aws_lambda_event_sources.SqsEventSourceProps = {
      // Honour the batchItemFailures the runtime returns - without this, SQS treats the
      // whole batch as successful and failed messages are deleted instead of retried
      reportBatchItemFailures: true,

      ...(props.queueConfig.batchSize > 0
        ? {
            batchSize: props.queueConfig.batchSize,

            // FIFO event sources don't support a batching window
            ...(props.queueConfig.isFifo ? {} : { maxBatchingWindow: cdk.Duration.seconds(props.queueConfig.batchWindowInSeconds) }),
          }
        : {}),
    };

    queueFunction.lambdaFunction.addEventSource(new aws_lambda_event_sources.SqsEventSource(queueResource.queue, eventSourceOptions));
  }
}
