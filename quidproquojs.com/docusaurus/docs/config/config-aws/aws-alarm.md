---
title: defineAwsAlarm
description: Declare a CloudWatch metric alarm on a Lambda, API Gateway, DynamoDB, or SQS metric, optionally routed to an event bus.
---

# defineAwsAlarm

Declares a **CloudWatch metric alarm** for this service. You pick a namespace + metric (Lambda, API Gateway, DynamoDB, or SQS), a statistic and period, and the threshold/comparison that trips the alarm, and optionally route the alarm state to one or more [event buses](../core/event-bus.md) so it reaches a human. Use it to watch a specific resource metric that the default per-resource alarms and the service dashboard don't already cover.

- **On AWS:** each declared alarm becomes an `aws_cloudwatch.Alarm` (`QpqConfigAwsAlarmConstruct` in `@qpqjs/deploy-aws`), built entirely from the shared alarm fields, so it is namespace-agnostic. The metric is a plain `aws_cloudwatch.Metric` (namespace, metric name, statistic, period); the comparison operator maps to the matching CloudWatch `ComparisonOperator`. Each event-bus name in `onAlarm.publishToEventBus` resolves to that bus's SNS topic, and the alarm gets an `SnsAction` publishing state changes to it.

```typescript
import {
  defineAwsAlarm,
  AwsAlarmNamespace,
  AwsAlarmSqsMetricName,
  AwsAlarmStatistic,
  AwsAlarmPeriod,
  AwsAlarmOperator,
} from '@qpqjs/config-aws';

export default [
  // Alert when a queue's oldest message gets too old (a stuck consumer)
  defineAwsAlarm('orders-queue-backlog', {
    namespace: AwsAlarmNamespace.Sqs,
    metricName: AwsAlarmSqsMetricName.ApproximateAgeOfOldestMessage,
    statistic: AwsAlarmStatistic.Maximum,
    period: AwsAlarmPeriod.FiveMinutes,
    operator: AwsAlarmOperator.GreaterThanThreshold,
    threshold: 300,
    datapointsToAlarm: 2,
    evaluationPeriodsToAlarm: 3,
    onAlarm: {
      publishToEventBus: ['ops-alerts'],
    },
  }),
];
```

## Signature

```typescript
function defineAwsAlarm(
  name: string,
  alarmSettings: AwsAlarmNamespaceSpecificSettings,
  options?: QPQConfigAdvancedAwsAlarmSettings,
): AwsAlarmQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

A unique name for the alarm (its `uniqueKey`). It is prefixed with application/module/environment to form the physical CloudWatch alarm name.

### `alarmSettings` — namespace-specific settings (required)

The alarm definition. It is a discriminated union on `namespace`: the allowed `metricName` values depend on the chosen namespace (see below). All namespaces share these base fields:

| Property | Type | Description |
| --- | --- | --- |
| `namespace` | `AwsAlarmNamespace` | The AWS service namespace being watched. Also selects which `metricName` enum is valid. |
| `metricName` | namespace-specific enum | The metric to alarm on (see the per-namespace tables below). |
| `statistic` | `AwsAlarmStatistic` | The statistic applied to the metric over each period. |
| `period` | `AwsAlarmPeriod` | The aggregation period (in seconds). |
| `operator` | `AwsAlarmOperator` | How `threshold` is compared to the metric value. |
| `threshold` | `number` | The value the comparison is made against. |
| `datapointsToAlarm` | `number` | How many datapoints within the evaluation window must breach for the alarm to fire. |
| `evaluationPeriodsToAlarm` | `number` | The number of periods CloudWatch evaluates (the "M of N" window, with `datapointsToAlarm` as M). |
| `onAlarm.publishToEventBus` | `string[]` | Optional. Event-bus names to publish alarm-state changes to (via each bus's SNS topic). |

### `options` — `QPQConfigAdvancedAwsAlarmSettings` (optional)

Advanced settings. Currently an empty interface extending the shared `QPQConfigAdvancedSettings`; reserved for future options.

### `AwsAlarmNamespace` and its metric names

The namespace determines which `metricName` enum you use.

| Namespace | Value | Metric-name enum |
| --- | --- | --- |
| `Lambda` | `AWS/Lambda` | `AwsAlarmLambdaMetricName` |
| `ApiGateway` | `AWS/ApiGateway` | `AwsAlarmApiGatewayMetricName` |
| `DynamoDb` | `AWS/DynamoDB` | `AwsAlarmDynamoDbMetricName` |
| `Sqs` | `AWS/SQS` | `AwsAlarmSqsMetricName` |

**`AwsAlarmLambdaMetricName`:** `Invocations`, `Errors`, `DeadLetterErrors`, `Duration`, `Throttles`, `IteratorAge`, `ConcurrentExecutions`, `UnreservedConcurrentExecutions`.

**`AwsAlarmApiGatewayMetricName`:** `Count`, `Latency`, `Error4XX` (`4XXError`), `Error5XX` (`5XXError`).

**`AwsAlarmDynamoDbMetricName`:** `ConsumedReadCapacityUnits`, `ConsumedWriteCapacityUnits`, `ProvisionedReadCapacityUnits`, `ProvisionedWriteCapacityUnits`, `ReadThrottleEvents`, `WriteThrottleEvents`, `SuccessfulRequestLatency`, `SystemErrors`, `UserErrors`.

**`AwsAlarmSqsMetricName`:** `NumberOfMessagesSent`, `NumberOfMessagesReceived`, `NumberOfMessagesDeleted`, `NumberOfMessagesReceivedButNotDeleted`, `SentMessageSize`, `ReceiveMessageSize`, `ApproximateNumberOfMessagesDelayed`, `ApproximateNumberOfMessagesVisible`, `ApproximateNumberOfMessagesNotVisible`, `ApproximateAgeOfOldestMessage`, `ApproximateNumberOfMessagesDelayedNotVisible`.

### `AwsAlarmStatistic`

`Minimum`, `Maximum`, `Average`, `Sum`, `SampleCount`, plus the CloudWatch extended-statistic patterns `Percentile` (`pNN.NN`), `TrimmedMean` (`tmNN.NN`), `InterquartileMean` (`iqm`), `WeightedMean` (`wmNN.NN`), `TruncatedCount` (`tcNN.NN`), and `TruncatedSum` (`tsNN.NN`).

### `AwsAlarmPeriod`

The period in seconds: `OneMinute` (60), `FiveMinutes` (300), `FifteenMinutes` (900).

### `AwsAlarmOperator`

How the metric is compared to `threshold`: `GreaterThanThreshold`, `GreaterThanOrEqualToThreshold`, `LessThanOrEqualToThreshold`, `LessThanThreshold`.

## Examples

```typescript
import {
  defineAwsAlarm,
  AwsAlarmNamespace,
  AwsAlarmLambdaMetricName,
  AwsAlarmStatistic,
  AwsAlarmPeriod,
  AwsAlarmOperator,
} from '@qpqjs/config-aws';

export default [
  // Alert when Lambda errors exceed 5 over two of three 1-minute periods
  defineAwsAlarm('worker-errors', {
    namespace: AwsAlarmNamespace.Lambda,
    metricName: AwsAlarmLambdaMetricName.Errors,
    statistic: AwsAlarmStatistic.Sum,
    period: AwsAlarmPeriod.OneMinute,
    operator: AwsAlarmOperator.GreaterThanThreshold,
    threshold: 5,
    datapointsToAlarm: 2,
    evaluationPeriodsToAlarm: 3,
    onAlarm: {
      publishToEventBus: ['ops-alerts'],
    },
  }),
];
```

## Related

- [defineEventBus](../core/event-bus.md) — the bus an alarm publishes state changes to via `onAlarm.publishToEventBus`.
- [defineEventBusQuickSubscription](./event-bus-quick-subscription.md) — attach email / webhook subscribers to that bus so alerts reach a human out-of-band.
- [defineNotifyError](../core/notify-error.md) — the default per-resource error/throttle alarms quidproquo creates automatically.
- [defineAwsServiceDashboard](./aws-service-dashboard.md) — a ready-made operational dashboard covering common metrics.
