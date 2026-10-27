import { NotifyErrorQPQConfigSetting } from 'quidproquo-core';

import { aws_cloudwatch, aws_cloudwatch_actions, aws_sns } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqCoreEventBusConstruct } from '..';

export interface QpqCoreNotifyErrorConstructProps extends QpqConstructBlockProps {
  notifyErrorConfig: NotifyErrorQPQConfigSetting;
}

export class QpqCoreNotifyErrorConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqCoreNotifyErrorConstructProps) {
    super(scope, id, props);

    // Create CloudWatch alarm for Lambda
    const errorsAlarm = new aws_cloudwatch.Alarm(this, `${props.notifyErrorConfig.uniqueKey}-error`, {
      alarmName: this.resourceName(`${props.notifyErrorConfig.name}-error`),
      metric: new aws_cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'sum',
        period: cdk.Duration.seconds(60),
      }),

      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,

      threshold: 1,
      evaluationPeriods: 1,
    });

    const throttlesAlarm = new aws_cloudwatch.Alarm(this, `${props.notifyErrorConfig.uniqueKey}-throttle`, {
      alarmName: this.resourceName(`${props.notifyErrorConfig.name}-throttle`),
      metric: new aws_cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        statistic: 'sum',
        period: cdk.Duration.seconds(60),
      }),

      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,

      threshold: 1,
      evaluationPeriods: 1,
    });

    // event bus'
    (props.notifyErrorConfig.onAlarm.publishToEventBus || []).forEach((eventBusName) => {
      const eventBus = QpqCoreEventBusConstruct.fromOtherStack(scope, `eventBus-${eventBusName}`, props.qpqConfig, eventBusName);

      errorsAlarm.addAlarmAction(new aws_cloudwatch_actions.SnsAction(eventBus.topic));
      throttlesAlarm.addAlarmAction(new aws_cloudwatch_actions.SnsAction(eventBus.topic));
    });
  }
}
