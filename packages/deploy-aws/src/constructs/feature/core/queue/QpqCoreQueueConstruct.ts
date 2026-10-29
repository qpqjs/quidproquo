import { awsNamingUtils } from '@qpqjs/actionprocessor-aws';
import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { QPQConfig, qpqCoreUtils, QueueQPQConfigSetting } from '@qpqjs/core';

import { aws_iam, aws_sqs } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsUtils from '../../../../utils/qpqDeployAwsUtils';
import { createDefaultResourceAlarm } from '../../../base/createDefaultResourceAlarm';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export type QpqCoreQueueConstructProps = {
  queueConfig: QueueQPQConfigSetting;
} & QpqConstructBlockProps;

// The same owner-fallback derivation the runtime send processor and the service role use.
const resolveSubscribedTopicArns = (qpqConfig: QPQConfig, queueConfig: QueueQPQConfigSetting): string[] =>
  queueConfig.eventBusSubscriptions.map((eventBusName) => {
    const eventBusConfig = qpqCoreUtils.getEventBusConfigByName(eventBusName, qpqConfig);
    if (!eventBusConfig) {
      throw new Error(`Queue [${queueConfig.name}] subscribes to an undefined event bus [${eventBusName}]`);
    }

    return awsNamingUtils.getEventBusSnsTopicArn(
      eventBusConfig.owner?.resourceNameOverride || eventBusConfig.name,
      qpqConfig,
      eventBusConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),
      eventBusConfig.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
      eventBusConfig.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig),
      eventBusConfig.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
      eventBusConfig.isFifo,
    );
  });

export abstract class QpqCoreQueueConstructBase extends QpqConstructBlock {
  abstract queue: aws_sqs.IQueue;

  public override grantRead(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.queue.grant(
      grantee,
      'sqs:GetQueueAttributes',
      'sqs:GetQueueUrl',
      'sqs:ListDeadLetterSourceQueues',
      'sqs:ReceiveMessage',
      'sqs:PeekMessage',
    );
  }

  public override grantWrite(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.queue.grant(grantee, 'sqs:SendMessage');
  }
}

export class QpqCoreQueueConstruct extends QpqCoreQueueConstructBase {
  queue: aws_sqs.IQueue;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, queueConfig: QueueQPQConfigSetting): QpqCoreQueueConstructBase {
    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(qpqConfig);

    const queueArn = `arn:aws:sqs:${qpqConfigAwsUtils.getApplicationModuleDeployRegion(
      qpqConfig,
    )}:${accountId}:${awsNamingUtils.getQueueRuntimeResourceNameFromConfig(queueConfig.name, qpqConfig)}`;

    class Import extends QpqCoreQueueConstructBase {
      queue = aws_sqs.Queue.fromQueueAttributes(scope, `${id}-${queueConfig.uniqueKey}`, {
        queueArn: queueArn,
      });
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreQueueConstructProps) {
    super(scope, id, props);

    // Queue names max out at 80 chars including the .fifo suffix, and a FIFO queue's dead
    // letter queue must itself be FIFO. contentBasedDeduplication stays off: message bodies
    // embed a per-send storySession, so content hashes would never match - dedup ids are
    // set explicitly at send time instead.
    const isFifo = props.queueConfig.isFifo;

    const deadLetterQueue = new aws_sqs.Queue(this, 'DeadLetterQueue', {
      queueName: awsNamingUtils.withFifoSuffix(this.resourceName(`${props.queueConfig.name}-dead`), isFifo),
      fifo: isFifo || undefined,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enforceSSL: true,
    });

    this.queue = new aws_sqs.Queue(this, 'MainQueue', {
      queueName: awsNamingUtils.withFifoSuffix(this.resourceName(props.queueConfig.name), isFifo),
      fifo: isFifo || undefined,
      visibilityTimeout: cdk.Duration.seconds(props.queueConfig.ttRetryInSeconds),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Message bodies carry a story session; refuse plain-http requests
      enforceSSL: true,

      deadLetterQueue: {
        maxReceiveCount: props.queueConfig.maxTries,
        queue: deadLetterQueue,
      },
    });

    qpqDeployAwsUtils.applyEnvironmentTags(this.queue, props.qpqConfig);

    // Default alarms (opt-in via defineNotifyError): a growing backlog on the
    // main queue, and anything landing in the dead-letter queue (failed messages).
    createDefaultResourceAlarm(this, props.qpqConfig, {
      id: 'default-alarm-oldest-message',
      alarmName: this.resourceName(`${props.queueConfig.name}-oldest-message`),
      metric: this.queue.metricApproximateAgeOfOldestMessage({ period: cdk.Duration.minutes(1), statistic: 'Maximum' }),
      threshold: 15 * 60, // oldest message older than 15 minutes => backlog
      evaluationPeriods: 3,
      datapointsToAlarm: 3,
    });
    createDefaultResourceAlarm(this, props.qpqConfig, {
      id: 'default-alarm-dead-letter',
      alarmName: this.resourceName(`${props.queueConfig.name}-dead-letter`),
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(1), statistic: 'Maximum' }),
      threshold: 1, // any message in the DLQ is worth a look
      evaluationPeriods: 1,
    });

    // The subscription itself is made in the api stack against an imported queue, which
    // cannot carry a policy, so the grant lives here: exactly the topics this queue
    // subscribes to (foreign buses resolve through their owner), never the whole account,
    // because a delivered body carries a session the handler trusts.
    const subscribedTopicArns = resolveSubscribedTopicArns(props.qpqConfig, props.queueConfig);

    if (subscribedTopicArns.length > 0) {
      this.queue.addToResourcePolicy(
        new aws_iam.PolicyStatement({
          sid: 'AllowSubscribedTopics',
          effect: aws_iam.Effect.ALLOW,
          principals: [new aws_iam.ServicePrincipal('sns.amazonaws.com')],
          actions: ['sqs:SendMessage'],
          resources: [this.queue.queueArn],
          conditions: {
            ArnEquals: {
              'aws:SourceArn': subscribedTopicArns,
            },
          },
        }),
      );
    }
  }

  public static authorizeActionsForRole(role: aws_iam.IRole, queues: QpqCoreQueueConstruct[]) {
    if (queues.length > 0) {
      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: [
            'sqs:GetQueueAttributes',
            'sqs:GetQueueUrl',
            'sqs:ListDeadLetterSourceQueues',
            'sqs:ReceiveMessage',
            'sqs:PeekMessage',
            'sqs:SendMessage',
          ],
          resources: queues.map((queue) => queue.queue.queueArn),
        }),
      );
    }
  }
}
