---
title: defineAccountSecurityServices
description: Define account-level AWS security services — GuardDuty, Security Hub, and a Cognito auth-failure alarm — for an AWS account.
---

# defineAccountSecurityServices

Defines **account-level AWS security services**: optionally a GuardDuty threat-detection detector, a Security Hub hub, and an email alarm that fires when Cognito sign-in failures spike (credential stuffing hitting Cognito directly, bypassing your APIs).

This is an **account/organization bootstrap setting**: it configures the AWS account, not a deployed service. It is declared in a dedicated *account config* alongside the other `defineAccount*` settings and deployed by the account stack. Everything here is **opt-in** — creating account singletons should be a deliberate act. GuardDuty detectors and Security Hub hubs are one-per-account+region, so if several environments share one AWS account, enable them in only one environment's account config. There is a single `defineAccountSecurityServices` per account config (its `uniqueKey` is the constant `'accountSecurityServices'`).

- **On AWS:** deployed by `QpqAccountSecurityServicesConstruct` in the account stack (`AccountQpqStack`). When enabled it creates a GuardDuty `CfnDetector` and/or a Security Hub `CfnHub`. When `cognitoAuthFailureAlert` is set it creates a CloudWatch Logs `MetricFilter` (on the account CloudTrail's log group, matching `cognito-idp` `NotAuthorizedException` events), a `qpq/security` metric, an SNS topic (`qpq-account-security-alerts`) with an email subscription per address, and a CloudWatch `Alarm` that notifies the topic.

```typescript
import { defineAccountSecurityServices } from '@qpqjs/config-aws';

export default [
  defineAccountSecurityServices({
    enableGuardDuty: true,
  }),
];
```

## Signature

```typescript
function defineAccountSecurityServices(
  options?: {
    enableGuardDuty?: boolean;
    enableSecurityHub?: boolean;
    cognitoAuthFailureAlert?: AccountAuthFailureAlert;
  },
): AccountSecurityServicesQPQConfigSetting;
```

## Parameters

### `options` — (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `enableGuardDuty` | `boolean` | `false` | Creates a GuardDuty detector (`CfnDetector`, `enable: true`). Opt-in: detectors are one-per-account+region and are often managed outside the stack (e.g. an AWS Organizations delegated admin auto-enables them, and a CloudFormation create would collide with that detector). |
| `enableSecurityHub` | `boolean` | `false` | Creates a Security Hub hub (`CfnHub`). Opt-in: its compliance standards require AWS Config recording, which bills per configuration item and often outweighs everything else — enable knowingly. |
| `cognitoAuthFailureAlert` | `AccountAuthFailureAlert` | – | Emails an alert when Cognito sign-in failures spike. **Requires** a [defineAccountCloudTrail](./account-cloud-trail.md) with `cloudWatchLogs` enabled — the deploy throws otherwise. See [`AccountAuthFailureAlert`](#accountauthfailurealert). |

### `AccountAuthFailureAlert`

```typescript
export interface AccountAuthFailureAlert {
  emails: string[];
  thresholdPer5Minutes?: number;
}
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `emails` | `string[]` | (required) | Addresses subscribed to the SNS alert topic that the alarm notifies. |
| `thresholdPer5Minutes` | `number` | `10` | Number of failed Cognito sign-ins per 5-minute window before the alarm fires. Missing data is treated as not-breaching (no sign-in attempts is not an alarm state). |

## Notes

- The `cognitoAuthFailureAlert` detects credential stuffing that hits Cognito directly, bypassing your APIs — these show up as `cognito-idp` `NotAuthorizedException` events in CloudTrail. Failed logins through quidproquo routes are covered separately by the per-API 401-rate alarms.
- Because both GuardDuty and Security Hub are account singletons, they live in the account stack rather than any app's bootstrap — an app teardown must not take the account's threat detection with it.

## Examples

```typescript
import { defineAccountSecurityServices, defineAccountCloudTrail } from '@qpqjs/config-aws';

export default [
  // CloudTrail with CloudWatch delivery is required for the auth-failure alarm
  defineAccountCloudTrail('audit', {
    cloudWatchLogs: { retentionDays: 90 },
  }),

  defineAccountSecurityServices({
    enableGuardDuty: true,
    enableSecurityHub: true,
    cognitoAuthFailureAlert: {
      emails: ['security@example.com'],
      thresholdPer5Minutes: 25,
    },
  }),
];
```

## Related

- [defineAccountCloudTrail](./account-cloud-trail.md) — required (with `cloudWatchLogs`) for the Cognito auth-failure alarm's metric filter.
- [defineAccountBudget](./account-budget.md) — cost budget & anomaly alerts, another `defineAccount*` bootstrap setting on the same account stack.
- **AWS implementation:** `QpqAccountSecurityServicesConstruct` (GuardDuty detector, Security Hub hub, CloudWatch metric filter/alarm, SNS topic) in `@qpqjs/deploy-aws`.
