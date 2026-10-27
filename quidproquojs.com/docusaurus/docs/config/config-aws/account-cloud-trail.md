---
title: defineAccountCloudTrail
description: Define an account-level AWS CloudTrail audit trail, with an S3 log bucket and optional CloudWatch Logs delivery.
---

# defineAccountCloudTrail

Defines an **account-level CloudTrail audit trail** that records AWS API activity for the account into a dedicated, private S3 bucket, with optional delivery to a CloudWatch Logs group.

This is an **account/organization bootstrap setting**: it configures the AWS account, not a deployed service. It is declared in a dedicated *account config* alongside the other `defineAccount*` settings and deployed by the account stack, once per account. One trail per account is the expected usage — additional trails bill a second copy of every management event.

- **On AWS:** deploys an `aws_cloudtrail.Trail` writing to a private, SSE-S3-encrypted, SSL-enforced S3 bucket (`qpq-cloudtrail-<accountId>-<region>-<name>`, retained on teardown, with a lifecycle expiration equal to `retentionDays`). When `cloudWatchLogs` is set, it also creates a CloudWatch Logs group (`/qpq/cloudtrail/<name>`, destroyed on teardown) and sends trail events to it. Deployed by `QpqAccountCloudTrailConstruct` in the account stack (`AccountQpqStack`).

```typescript
import { defineAccountCloudTrail } from '@qpqjs/config-aws';

export default [
  defineAccountCloudTrail('audit'),
];
```

## Signature

```typescript
function defineAccountCloudTrail(
  name: string,
  options?: {
    retentionDays?: number;
    enableLogFileValidation?: boolean;
    multiRegion?: boolean;
    includeGlobalServiceEvents?: boolean;
    cloudWatchLogs?: { retentionDays?: number };
  },
): AccountCloudTrailQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The trail's name. Used as the setting's `uniqueKey` and baked into the physical resource names — the trail is named `<name>-trail`, the S3 bucket `qpq-cloudtrail-<accountId>-<region>-<name>`, and (if enabled) the log group `/qpq/cloudtrail/<name>`.

### `options` — (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `retentionDays` | `number` | `365` | Number of days log objects are retained in the S3 bucket before an S3 lifecycle rule expires them. |
| `enableLogFileValidation` | `boolean` | `true` | Enables CloudTrail log file integrity validation (digest files that let you detect tampering). |
| `multiRegion` | `boolean` | `true` | Makes the trail a multi-region trail, capturing events from every AWS Region. |
| `includeGlobalServiceEvents` | `boolean` | `true` | Includes events from global services (e.g. IAM, CloudFront) in the trail. |
| `cloudWatchLogs` | `{ retentionDays?: number }` | – (not delivered to CloudWatch) | When set, delivers trail events to a CloudWatch Logs group. `retentionDays` sets the log group's retention (resolved to the nearest supported CloudWatch retention period; omit for the construct default). This log group is what [defineAccountSecurityServices](./account-security-services.md)'s `cognitoAuthFailureAlert` runs its metric filter against. |

## Examples

```typescript
import { defineAccountCloudTrail } from '@qpqjs/config-aws';

export default [
  // Audit trail with CloudWatch delivery, so the Cognito auth-failure alarm can attach
  defineAccountCloudTrail('audit', {
    retentionDays: 730,
    cloudWatchLogs: { retentionDays: 90 },
  }),
];
```

## Notes

- The `cloudWatchLogs` option is a prerequisite for the `cognitoAuthFailureAlert` in [defineAccountSecurityServices](./account-security-services.md): that alert's metric filter reads this trail's CloudWatch log group, and the deploy throws if the alert is requested without a trail that publishes to CloudWatch.

## Related

- [defineAccountSecurityServices](./account-security-services.md) — consumes this trail's CloudWatch log group for its Cognito auth-failure alarm.
- [defineAccountBudget](./account-budget.md) — cost budget & anomaly alerts, another `defineAccount*` bootstrap setting on the same account stack.
- **AWS implementation:** `QpqAccountCloudTrailConstruct` (CloudTrail trail, S3 log bucket, optional CloudWatch Logs group) in `@qpqjs/deploy-awscdk`.
