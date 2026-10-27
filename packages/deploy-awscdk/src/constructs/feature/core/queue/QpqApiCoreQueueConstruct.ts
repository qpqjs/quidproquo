import { qpqCoreUtils, QueueQPQConfigSetting } from 'quidproquo-core';

import { aws_lambda, aws_lambda_event_sources, aws_sns_subscriptions } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';
import { QpqCoreEventBusConstruct } from '../eventBus/QpqCoreEventBusConstruct';
import { QpqCoreQueueConstruct } from './QpqCoreQueueConstruct';

export interface QpqApiCoreQueueConstructProps extends QpqConstructBlockProps {
  queueConfig: QueueQPQConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
}

export class QpqApiCoreQueueConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqApiCoreQueueConstructProps) {
    super(scope, id, props);

    const queueFunction = new Function(this, props.queueConfig.uniqueKey, {
      functionName: this.resourceName(`${props.queueConfig.uniqueKey}-queue`),
      functionType: 'sqsEvent_queueEvent',
      executorName: 'sqsEvent_queueEvent',

      qpqConfig: props.qpqConfig,

      apiLayerVersions: props.apiLayerVersions,

      environment: {
        // Just the name - the runtime resolves the full setting from the bundled
        // qpqConfig. Serializing the whole setting here blows the lambda 4KB
        // env limit once processors carry large globals (e.g. AI system prompts).
        queueName: props.queueConfig.name,
      },

      reservedConcurrentExecutions: props.queueConfig.maxConcurrentExecutions,

      // Timeout in 15 mins ~ Max
      // Note: AWS requires that the visibility timeout of the SQS queue be greater than or
      //       equal to the timeout of the Lambda function. This is because if a message is
      //       processed by a Lambda function for a time longer than the SQS visibility timeout,
      //       the message will become visible in the SQS queue again and could be consumed
      //       by another Lambda function, resulting in the message being processed multiple times.
      timeoutInSeconds: Math.min(props.queueConfig.ttRetryInSeconds, 15 * 60),

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
