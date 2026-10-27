import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { AwsServiceDashboardQPQConfigSetting, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { aws_cloudwatch, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Imported by direct path (not the barrel) for the same import-cycle reason as
// createDefaultResourceAlarm
import { getNotifyErrorEventBusNames } from '../../../base/createDefaultResourceAlarm';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqCoreEventBusConstruct } from '../../core/eventBus/QpqCoreEventBusConstruct';

export interface QpqConfigAwsDashboardConstructProps extends QpqConstructBlockProps {
  dashboardConfig: AwsServiceDashboardQPQConfigSetting;
}

const FIVE_MINUTES = Duration.minutes(5);

// The service lambdas worth watching operationally (api routes, service functions, queue
// consumers, schedules, websocket handlers). Infra lambdas (deploy events, storage-drive
// triggers, user-directory triggers, SEO/edge) are deliberately excluded to keep the
// dashboard focused. All names are config-derived - no construct handles needed.
const getServiceLambdaFunctionNames = (qpqConfig: QPQConfig): string[] => {
  const baseNames = [
    ...qpqWebServerUtils.getApiConfigs(qpqConfig).map((api) => `${api.apiName}-route`),
    ...qpqWebServerUtils.getOwnedServiceFunctions(qpqConfig).map((serviceFunction) => `${serviceFunction.functionName}-sfunc`),
    ...qpqCoreUtils.getQueues(qpqConfig).map((queue) => `${queue.uniqueKey}-queue`),
    ...qpqCoreUtils.getOwnedScheduleEvents(qpqConfig).map((schedule) => `${schedule.uniqueKey}-SE`),
    ...qpqWebServerUtils.getOwnedWebsocketSettings(qpqConfig).map((websocket) => `${websocket.apiName}-ws`),
  ];

  return baseNames.map((name) => awsNamingUtils.getConfigRuntimeResourceNameFromConfig(name, qpqConfig));
};

const lambdaMetric = (metricName: string, functionName: string, statistic: string): aws_cloudwatch.Metric =>
  new aws_cloudwatch.Metric({
    namespace: 'AWS/Lambda',
    metricName,
    dimensionsMap: { FunctionName: functionName },
    statistic,
    period: FIVE_MINUTES,
    label: functionName,
  });

// A per-service operational dashboard built purely from config-derived resource names,
// plus anomaly detection: detector models (free) on api latency and lambda duration power
// the band widgets, and api latency anomaly alarms route via defineNotifyError (same
// opt-in + targets as createDefaultResourceAlarm). Websocket apis are absent - their
// metrics dimension on the AWS-generated ApiId, which is unknowable from config.
export class QpqConfigAwsDashboardConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqConfigAwsDashboardConstructProps) {
    super(scope, id, props);

    const anomalyDetectionEnabled = !props.dashboardConfig.disableAnomalyDetection;

    const dashboard = new aws_cloudwatch.Dashboard(this, 'dashboard', {
      dashboardName: this.resourceName('dashboard'),
    });

    // Api row
    qpqWebServerUtils.getApiConfigs(props.qpqConfig).forEach((apiConfig) => {
      const apiName = this.resourceName(`${apiConfig.apiName}-rest-api`);

      const apiMetric = (metricName: string, statistic: string, label?: string): aws_cloudwatch.Metric =>
        new aws_cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName,
          dimensionsMap: { ApiName: apiName },
          statistic,
          period: FIVE_MINUTES,
          label: label || metricName,
        });

      const averageLatency = apiMetric('Latency', 'Average', 'Latency (avg)');

      dashboard.addWidgets(
        new aws_cloudwatch.GraphWidget({
          title: `${apiConfig.apiName} api - requests and errors`,
          width: 12,
          left: [apiMetric('Count', 'Sum'), apiMetric('4XXError', 'Sum'), apiMetric('5XXError', 'Sum')],
        }),
        new aws_cloudwatch.GraphWidget({
          title: `${apiConfig.apiName} api - latency`,
          width: 12,
          left: [
            apiMetric('Latency', 'p50', 'Latency p50'),
            apiMetric('Latency', 'p95', 'Latency p95'),
            apiMetric('Latency', 'p99', 'Latency p99'),
            ...(anomalyDetectionEnabled
              ? [
                  new aws_cloudwatch.MathExpression({
                    expression: 'ANOMALY_DETECTION_BAND(latencyAvg, 2)',
                    usingMetrics: { latencyAvg: averageLatency },
                    label: 'Latency expected band',
                    period: FIVE_MINUTES,
                  }),
                ]
              : []),
          ],
        }),
      );

      if (anomalyDetectionEnabled) {
        new aws_cloudwatch.CfnAnomalyDetector(this, `latency-anomaly-detector-${apiConfig.apiName}`, {
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          stat: 'Average',
          dimensions: [{ name: 'ApiName', value: apiName }],
        });

        // Anomaly alarm needs the L1 (the L2 Alarm has no thresholdMetricId). Gated and
        // routed like createDefaultResourceAlarm: no-op without a defineNotifyError.
        if (qpqCoreUtils.getNotifyErrorConfigs(props.qpqConfig).length > 0) {
          const alarmActionTopicArns = getNotifyErrorEventBusNames(props.qpqConfig).map(
            (busName) =>
              QpqCoreEventBusConstruct.fromOtherStack(this, `latency-anomaly-bus-${apiConfig.apiName}-${busName}`, props.qpqConfig, busName).topic
                .topicArn,
          );

          new aws_cloudwatch.CfnAlarm(this, `latency-anomaly-alarm-${apiConfig.apiName}`, {
            alarmName: this.resourceName(`${apiConfig.apiName}-latency-anomaly`),
            comparisonOperator: 'GreaterThanUpperThreshold',
            thresholdMetricId: 'ad1',
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
            metrics: [
              {
                id: 'm1',
                metricStat: {
                  metric: {
                    namespace: 'AWS/ApiGateway',
                    metricName: 'Latency',
                    dimensions: [{ name: 'ApiName', value: apiName }],
                  },
                  period: 300,
                  stat: 'Average',
                },
                returnData: true,
              },
              {
                id: 'ad1',
                expression: 'ANOMALY_DETECTION_BAND(m1, 2)',
                returnData: true,
              },
            ],
            alarmActions: alarmActionTopicArns,
          });
        }
      }
    });

    // Lambda row
    const functionNames = getServiceLambdaFunctionNames(props.qpqConfig);
    if (functionNames.length > 0) {
      dashboard.addWidgets(
        new aws_cloudwatch.GraphWidget({
          title: 'lambda - invocations',
          width: 6,
          left: functionNames.map((name) => lambdaMetric('Invocations', name, 'Sum')),
        }),
        new aws_cloudwatch.GraphWidget({
          title: 'lambda - errors',
          width: 6,
          left: functionNames.map((name) => lambdaMetric('Errors', name, 'Sum')),
        }),
        new aws_cloudwatch.GraphWidget({
          title: 'lambda - duration (avg)',
          width: 6,
          left: functionNames.map((name) => lambdaMetric('Duration', name, 'Average')),
        }),
        new aws_cloudwatch.GraphWidget({
          title: 'lambda - concurrent executions',
          width: 6,
          left: functionNames.map((name) => lambdaMetric('ConcurrentExecutions', name, 'Maximum')),
        }),
      );

      if (anomalyDetectionEnabled) {
        // Detector models are free - they power expected-value bands on the duration metrics
        functionNames.forEach((functionName, index) => {
          new aws_cloudwatch.CfnAnomalyDetector(this, `duration-anomaly-detector-${index}`, {
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            stat: 'Average',
            dimensions: [{ name: 'FunctionName', value: functionName }],
          });
        });
      }
    }

    // Data row
    const tableWidgets = qpqCoreUtils.getOwnedKeyValueStores(props.qpqConfig).map((kvsConfig) => {
      const tableName = this.qpqResourceName(kvsConfig.keyValueStoreName, 'kvs');

      const tableMetric = (metricName: string, label: string): aws_cloudwatch.Metric =>
        new aws_cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName,
          dimensionsMap: { TableName: tableName },
          statistic: 'Sum',
          period: FIVE_MINUTES,
          label,
        });

      return new aws_cloudwatch.GraphWidget({
        title: `${kvsConfig.keyValueStoreName} table`,
        width: 6,
        left: [tableMetric('ReadThrottleEvents', 'read throttles'), tableMetric('WriteThrottleEvents', 'write throttles')],
        right: [tableMetric('ConsumedReadCapacityUnits', 'read capacity'), tableMetric('ConsumedWriteCapacityUnits', 'write capacity')],
      });
    });

    const queueWidgets = qpqCoreUtils.getQueues(props.qpqConfig).map((queueConfig) => {
      const queueMetric = (queueName: string, metricName: string, label: string): aws_cloudwatch.Metric =>
        new aws_cloudwatch.Metric({
          namespace: 'AWS/SQS',
          metricName,
          dimensionsMap: { QueueName: this.resourceName(queueName) },
          statistic: 'Maximum',
          period: FIVE_MINUTES,
          label,
        });

      return new aws_cloudwatch.GraphWidget({
        title: `${queueConfig.name} queue`,
        width: 6,
        left: [queueMetric(queueConfig.name, 'ApproximateAgeOfOldestMessage', 'oldest message age (s)')],
        right: [queueMetric(`${queueConfig.name}-dead`, 'ApproximateNumberOfMessagesVisible', 'dead letter messages')],
      });
    });

    if (tableWidgets.length > 0 || queueWidgets.length > 0) {
      dashboard.addWidgets(...tableWidgets, ...queueWidgets);
    }

    // Waf row (regional acl protecting the apis - shared per app+environment)
    if (qpqConfigAwsUtils.isWafProtectionEnabled(props.qpqConfig)) {
      const wafMetric = (metricName: string): aws_cloudwatch.Metric =>
        new aws_cloudwatch.Metric({
          namespace: 'AWS/WAFV2',
          metricName,
          dimensionsMap: {
            WebACL: `qpq-waf-regional-${qpqCoreUtils.getApplicationName(props.qpqConfig)}-${qpqCoreUtils.getApplicationModuleEnvironment(props.qpqConfig)}`,
            Region: qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig),
            Rule: 'ALL',
          },
          statistic: 'Sum',
          period: FIVE_MINUTES,
          label: metricName,
        });

      dashboard.addWidgets(
        new aws_cloudwatch.GraphWidget({
          title: 'waf - allowed vs blocked',
          width: 12,
          left: [wafMetric('AllowedRequests'), wafMetric('BlockedRequests')],
        }),
      );
    }
  }
}
