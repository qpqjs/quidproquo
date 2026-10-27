import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { getAwsAccountIds } from 'quidproquo-config-aws';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig, QueueQPQConfigSetting } from 'quidproquo-core';

import { aws_iam, aws_sqs } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils/qpqDeployAwsCdkUtils';
import { createDefaultResourceAlarm } from '../../../base/createDefaultResourceAlarm';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqCoreQueueConstructProps extends QpqConstructBlockProps {
  queueConfig: QueueQPQConfigSetting;
}

export abstract class QpqCoreQueueConstructBase extends QpqConstructBlock {
  abstract queue: aws_sqs.IQueue;

  public grantRead(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.queue.grant(
      grantee,
      'sqs:GetQueueAttributes',
      'sqs:GetQueueUrl',
      'sqs:ListDeadLetterSourceQueues',
      'sqs:ReceiveMessage',
      'sqs:PeekMessage',
    );
  }

  public grantWrite(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.queue.grant(grantee, 'sqs:SendMessage');
  }

  public grantAll(grantee: aws_iam.IGrantable): void {
    this.grantRead(grantee);
    this.grantWrite(grantee);
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
    });

    this.queue = new aws_sqs.Queue(this, 'MainQueue', {
      queueName: awsNamingUtils.withFifoSuffix(this.resourceName(props.queueConfig.name), isFifo),
      fifo: isFifo || undefined,
      visibilityTimeout: cdk.Duration.seconds(props.queueConfig.ttRetryInSeconds),
      removalPolicy: cdk.RemovalPolicy.DESTROY,

      deadLetterQueue: {
        maxReceiveCount: props.queueConfig.maxTries,
        queue: deadLetterQueue,
      },
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(this.queue, props.qpqConfig);

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

    const accountIds = getAwsAccountIds(props.qpqConfig);

    // This has to be any topic arn as we want other services / apps to be able
    // to publish to this queue
    accountIds.forEach((accountId) => {
      this.queue.addToResourcePolicy(
        new aws_iam.PolicyStatement({
          sid: `AllowSNSServicePrincipal_${accountId}`,
          effect: aws_iam.Effect.ALLOW,
          principals: [new aws_iam.ServicePrincipal('sns.amazonaws.com')],
          actions: ['sqs:SendMessage'],
          resources: [this.queue.queueArn],
          conditions: {
            ArnEquals: {
              'aws:SourceArn': `arn:aws:sns:*:${accountId}:*`,
            },
          },
        }),
      );
    });
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
