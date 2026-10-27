---
title: defineAccountBudget
description: Define an AWS Budgets monthly cost budget with email threshold alerts plus Cost Anomaly Detection for an AWS account.
---

# defineAccountBudget

Defines an **account-level monthly cost budget** with email alerts at configurable spend thresholds, plus AWS Cost Anomaly Detection for spend that deviates from the account's baseline (the slow cost creep that fixed percentage thresholds miss).

This is an **account/organization bootstrap setting**: it does not configure a deployed service — it configures the AWS account itself. It is declared in a dedicated *account config* (an application config with no module, alongside the other `defineAccount*` settings) and deployed by the account stack, once per account.

- **On AWS:** deploys an AWS Budgets `CfnBudget` (a `COST`, `MONTHLY` budget) with one email notification per threshold, and — unless anomaly detection is disabled — an `aws_ce` `CfnAnomalyMonitor` (`DIMENSIONAL` / `SERVICE`) plus a `CfnAnomalySubscription` that emails subscribers daily. Deployed by `QpqAccountBudgetConstruct` in the account stack (`AccountQpqStack`). AWS allows only **one** service-dimension anomaly monitor per account, so if several environments share one account, enable anomaly detection in only one of them (or set `anomalyDetection.disabled` on the extras).

```typescript
import { defineAccountBudget } from '@qpqjs/config-aws';

export default [
  defineAccountBudget('primary', 500, ['billing@example.com']),
];
```

## Signature

```typescript
function defineAccountBudget(
  name: string,
  monthlyLimitUsd: number,
  subscriberEmails: string[],
  options?: {
    thresholds?: BudgetThreshold[];
    anomalyDetection?: AccountBudgetAnomalyDetection;
  },
): AccountBudgetQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The budget's name. Used as the setting's `uniqueKey` and baked into the physical resource names (e.g. the budget is named `qpq-budget-<accountId>-<name>`, the anomaly monitor `qpq-anomaly-monitor-<accountId>-<name>`).

### `monthlyLimitUsd` — `number` (required)

The monthly cost budget in USD. Threshold alerts are calculated as a percentage of this amount.

### `subscriberEmails` — `string[]` (required)

Email addresses that receive both the budget threshold notifications and the cost anomaly alerts.

### `options` — (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `thresholds` | `BudgetThreshold[]` | `80%` actual, `100%` forecasted, `100%` actual, `150%` actual | Alert thresholds. Each becomes one budget notification (`GREATER_THAN`, `PERCENTAGE`) emailing all subscribers. See [`BudgetThreshold`](#budgetthreshold). |
| `anomalyDetection` | `AccountBudgetAnomalyDetection` | anomaly detection enabled, `minimumImpactUsd` `10` | Controls the Cost Anomaly Detection monitor/subscription created alongside the budget. See [`AccountBudgetAnomalyDetection`](#accountbudgetanomalydetection). |

### `BudgetThreshold`

```typescript
export enum BudgetThresholdType {
  actual = 'actual',
  forecasted = 'forecasted',
}

export interface BudgetThreshold {
  thresholdPercent: number;
  type: BudgetThresholdType;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `thresholdPercent` | `number` | Percentage of `monthlyLimitUsd` at which to alert (e.g. `80` fires at 80% of the budget). |
| `type` | `BudgetThresholdType` | `actual` alerts on cost already incurred; `forecasted` alerts when the projected month-end cost is expected to cross the threshold. |

### `AccountBudgetAnomalyDetection`

```typescript
export interface AccountBudgetAnomalyDetection {
  disabled?: boolean;
  minimumImpactUsd?: number;
}
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Anomaly detection is created alongside the budget by default; set `true` to opt out (e.g. on the extra environments sharing an account, since AWS permits only one service-dimension monitor per account). |
| `minimumImpactUsd` | `number` | `10` | Minimum total cost impact (USD) before an anomaly alert is sent. Maps to the subscription's `ANOMALY_TOTAL_IMPACT_ABSOLUTE` threshold. |

## Examples

```typescript
import { defineAccountBudget, BudgetThresholdType } from '@qpqjs/config-aws';

export default [
  // Custom thresholds, anomaly detection kept on with a higher impact floor
  defineAccountBudget('primary', 2000, ['billing@example.com', 'cto@example.com'], {
    thresholds: [
      { thresholdPercent: 50, type: BudgetThresholdType.actual },
      { thresholdPercent: 90, type: BudgetThresholdType.forecasted },
      { thresholdPercent: 100, type: BudgetThresholdType.actual },
    ],
    anomalyDetection: { minimumImpactUsd: 50 },
  }),

  // A second environment sharing the same account: budget only, no anomaly monitor
  defineAccountBudget('staging', 300, ['billing@example.com'], {
    anomalyDetection: { disabled: true },
  }),
];
```

## Related

- [defineAccountCloudTrail](./account-cloud-trail.md) — account audit logging, another `defineAccount*` bootstrap setting deployed by the same account stack.
- [defineAccountSecurityServices](./account-security-services.md) — account threat-detection services deployed by the same account stack.
- **AWS implementation:** `QpqAccountBudgetConstruct` (AWS Budgets + Cost Explorer anomaly detection) in `@qpqjs/deploy-awscdk`.
