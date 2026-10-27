---
title: defineAwsServiceDashboard
description: Deploy a ready-made operational CloudWatch dashboard for the service, with anomaly detection.
---

# defineAwsServiceDashboard

Adds a default operational **CloudWatch dashboard** for this service — a single, config-derived view of its API traffic/errors/latency, Lambda invocations/errors/duration/concurrency, DynamoDB throttles/capacity, queue depth, and WAF allowed/blocked counts. It also enables anomaly detection on API latency and Lambda duration, with latency anomaly alarms routed the same way as the default per-resource alarms. Declare it on a service you want to watch operationally.

- **On AWS:** deploys an `aws_cloudwatch.Dashboard` (`QpqConfigAwsDashboardConstruct` in `@qpqjs/deploy-aws`). Widgets are built purely from config-derived resource names — API routes, service functions, queue consumers, schedules, and websocket handler Lambdas (infra Lambdas like deploy-event and storage-drive triggers are deliberately excluded). Unless disabled, it also creates anomaly-detector models (free) on API latency and Lambda duration to power the band widgets, plus API latency anomaly alarms that route via [`defineNotifyError`](../core/notify-error.md) (same opt-in and targets as the default resource alarms). Websocket APIs are absent from the metric widgets because their metrics dimension on the AWS-generated API id, which isn't knowable from config.

:::note Cost
CloudWatch dashboards are roughly US$3/month each beyond the first 3 free per account, so a dashboard per service adds up. Declare this only on services worth watching.
:::

```typescript
import { defineAwsServiceDashboard } from '@qpqjs/config-aws';

export default [
  defineAwsServiceDashboard(),
];
```

## Signature

```typescript
function defineAwsServiceDashboard(
  options?: Omit<AwsServiceDashboardQPQConfigSetting, 'configSettingType' | 'uniqueKey'>,
): AwsServiceDashboardQPQConfigSetting;
```

## Parameters

### `options` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `disableAnomalyDetection` | `boolean` | `false` | Skip the anomaly-detector models, the anomaly-band widgets, and the API latency anomaly alarms. The rest of the dashboard (plain metric widgets) is still deployed. |

:::note
This is a single, service-wide setting (its `uniqueKey` is fixed) — declare it at most once per service.
:::

## Examples

```typescript
import { defineAwsServiceDashboard } from '@qpqjs/config-aws';

export default [
  // Full dashboard with anomaly detection
  defineAwsServiceDashboard(),

  // Dashboard without the anomaly-detection models, bands, and alarms
  defineAwsServiceDashboard({ disableAnomalyDetection: true }),
];
```

## Related

- [defineAwsAlarm](./aws-alarm.md) — declare an additional custom alarm on a specific metric.
- [defineNotifyError](../core/notify-error.md) — the routing target the dashboard's latency anomaly alarms use.
