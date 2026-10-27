import { AwsAlarmOperator, AwsAlarmQPQConfigSetting } from 'quidproquo-config-aws';

import { aws_cloudwatch, aws_cloudwatch_actions } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqCoreEventBusConstruct } from '../../core';

export interface QpqConfigAwsAlarmConstructProps extends QpqConstructBlockProps {
  alarmConfig: AwsAlarmQPQConfigSetting;
}

function AwsAlarmOperatorToComparisonOperator(operator: AwsAlarmOperator): aws_cloudwatch.ComparisonOperator {
  switch (operator) {
    case AwsAlarmOperator.GreaterThanThreshold:
      return aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD;
    case AwsAlarmOperator.GreaterThanOrEqualToThreshold:
      return aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
    case AwsAlarmOperator.LessThanThreshold:
      return aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD;
    case AwsAlarmOperator.LessThanOrEqualToThreshold:
      return aws_cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD;
    default:
      throw new Error('Invalid AwsAlarmOperator value');
  }
}

export class QpqConfigAwsAlarmConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqConfigAwsAlarmConstructProps) {
    super(scope, id, props);

    // The alarm is built entirely from the shared BaseAwsAlarmQPQConfigSetting
    // fields, so it is namespace-agnostic — Lambda, ApiGateway, DynamoDb and Sqs
    // (and any future namespace) are all supported via the config's namespace +
    // metricName pair, no per-namespace branching required.
    const alarmSettings = props.alarmConfig.alarmSettings;

    const alarm = new aws_cloudwatch.Alarm(this, props.alarmConfig.uniqueKey, {
      alarmName: this.resourceName(props.alarmConfig.name),
      metric: new aws_cloudwatch.Metric({
        namespace: alarmSettings.namespace,
        metricName: alarmSettings.metricName,
        statistic: alarmSettings.statistic,
        period: cdk.Duration.seconds(alarmSettings.period),
      }),
      threshold: alarmSettings.threshold,
      comparisonOperator: AwsAlarmOperatorToComparisonOperator(alarmSettings.operator),
      datapointsToAlarm: alarmSettings.datapointsToAlarm,
      evaluationPeriods: alarmSettings.evaluationPeriodsToAlarm,
    });

    alarmSettings.onAlarm.publishToEventBus?.forEach((eventBusName) => {
      const eventBus = QpqCoreEventBusConstruct.fromOtherStack(scope, 'eventBus', props.qpqConfig, eventBusName);

      alarm.addAlarmAction(new aws_cloudwatch_actions.SnsAction(eventBus.topic));
    });
  }
}
