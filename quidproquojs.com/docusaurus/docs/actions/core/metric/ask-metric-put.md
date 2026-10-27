---
title: askMetricPut
description: Emit a custom metric data point from a story (a CloudWatch metric on AWS).
---

# askMetricPut

Emits a single custom metric data point — a named value, with an optional unit and dimensions.

- **Action type:** `MetricActionType.Put`
- **On AWS:** the metric is written to **CloudWatch** as an [Embedded Metric Format](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html) (EMF) log line, from which CloudWatch extracts the metric — no API call, no extra IAM, and no latency added to the story. The namespace is `qpq/<application>/<environment>[/<feature>]` and a `service` dimension is always included alongside any dimensions you supply.

```typescript
import { askMetricPut, MetricUnit } from '@qpqjs/core';

export function* askCompleteCheckout(amountMs: number) {
  yield* askMetricPut('CheckoutsCompleted');
  yield* askMetricPut('CheckoutDuration', amountMs, { unit: MetricUnit.milliseconds });
}
```

## Signature

```typescript
function* askMetricPut(
  metricName: string,
  value?: number,
  options?: AskMetricPutOptions,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `metricName` | `string` | – | Name of the metric. |
| `value` | `number` | `1` | The value to record for this data point. |
| `options` | `AskMetricPutOptions` | – | Optional unit and dimensions — see below. |

### `AskMetricPutOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `unit` | `MetricUnit` | `MetricUnit.count` | The unit the value is measured in. See [`MetricUnit`](#metricunit). |
| `dimensions` | `Record<string, string>` | – | Extra dimensions on top of the standard `service` dimension. Each unique dimension combination is its own metric (and its own cost) — keep these **low-cardinality**: never per-user or per-request identifiers. |

### `MetricUnit`

The enum values are the CloudWatch unit strings.

| Member | CloudWatch unit |
| --- | --- |
| `MetricUnit.count` | `Count` |
| `MetricUnit.milliseconds` | `Milliseconds` |
| `MetricUnit.seconds` | `Seconds` |
| `MetricUnit.bytes` | `Bytes` |
| `MetricUnit.percent` | `Percent` |
| `MetricUnit.none` | `None` |

## Returns

`void` — the story resumes once the metric has been emitted.

## Notes

- When `unit` is omitted the metric is recorded as `Count`.
- The namespace embeds the full deployment identity (application / environment / feature), so per-developer feature sandboxes never pollute mainline metrics and apps sharing an account cannot merge same-named metrics.
