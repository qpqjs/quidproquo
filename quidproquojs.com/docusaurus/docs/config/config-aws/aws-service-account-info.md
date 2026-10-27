---
title: defineAwsServiceAccountInfo
description: Bind a service to the AWS account and region it deploys to, and tune its Lambda/logging defaults.
---

# defineAwsServiceAccountInfo

Binds this service to the **AWS account and region** it deploys into, and carries service-wide Lambda and logging defaults. It is the one required AWS setting — the deploy reads the target account/region from here, and cross-module resolution uses the `serviceInfoMap` to locate sibling services in other accounts/regions/environments. Exactly one `defineAwsServiceAccountInfo` is allowed per config.

- **On AWS:** consumed throughout `@qpqjs/deploy-awscdk` and `@qpqjs/actionprocessor-aws` via `getAwsServiceAccountInfoConfig` and friends. `deployAccountId`/`deployRegion` set the CloudFormation stack env; `apiLayers` become Lambda layer references; `lambdaMaxMemoryInMiB` sets the default function memory; the `disable*` flags toggle X-Ray tracing, reserved concurrency, and the Lambda-warming schedule; `logServiceName`, `disableLogs`, and `instantLogs` drive the logging pipeline. Resources across the `serviceInfoMap` are matched by module/environment/feature/application to resolve cross-service references.

```typescript
import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';

export default [
  defineAwsServiceAccountInfo('123456789012', 'us-east-1'),
];
```

## Signature

```typescript
function defineAwsServiceAccountInfo(
  deployAccountId: string,
  deployRegion: string,
  serviceInfoMap?: ServiceAccountInfo[],
  options?: QPQConfigAdvancedAwsServiceAccountInfoSettings,
): AwsServiceAccountInfoQPQConfigSetting;
```

## Parameters

### `deployAccountId` — `string` (required)

The AWS account id this service deploys into. Sets the CloudFormation stack account and is the default account for the service's own resources.

### `deployRegion` — `string` (required)

The AWS region this service deploys into.

### `serviceInfoMap` — `ServiceAccountInfo[]` (optional, default `[]`)

The account/region (and environment/feature) coordinates of **other** services this one references, so cross-module resource lookups can resolve resources that live in different accounts, regions, environments, or features. The current service's own entry is added automatically. Each entry:

```typescript
type ServiceAccountInfo = {
  moduleName: string;
  applicationName?: string;
  environment?: string;
  feature?: string;
  awsAccountId: string;
  awsRegion: string;
};
```

- **`moduleName`** — the module (service) name being located.
- **`applicationName` / `environment` / `feature`** — optional narrowing; unset parts match the current service. Cross-service resolution scores candidates by how specifically they match.
- **`awsAccountId` / `awsRegion`** — where that module is deployed.

### `options` — `QPQConfigAdvancedAwsServiceAccountInfoSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `apiLayers` | `ApiLayer[]` | `[]` | Lambda layers to attach to the service's functions. See [ApiLayer](#apilayer). |
| `lambdaMaxMemoryInMiB` | `number` | `1024` | Default memory (MiB) for the service's Lambda functions. Individual functions may still override this. |
| `cloudWatchLogRetentionDays` | `number` | `7` | How long CloudWatch keeps the service's Lambda function logs and API access logs. Rounded up to the nearest retention CloudWatch supports (1, 3, 5, 7, 14, 30, 60, 90 days and so on). |
| `logServiceName` | `string` | – | The service name used when writing structured logs. |
| `disableLogs` | `boolean` | `false` | Turn off the log-shipping pipeline for the service. |
| `disableLambdaWarming` | `boolean` | `false` | Don't create the scheduled warming rule that keeps functions warm. |
| `disableReservedConcurrency` | `boolean` | `false` | Don't apply reserved concurrency to functions (leaves them on unreserved account concurrency). |
| `disableTracing` | `boolean` | `false` | Deploy functions with X-Ray tracing set to `DISABLED` instead of `ACTIVE`. |
| `instantLogs` | `boolean` | `false` | Flush logs immediately rather than batching them (higher cost/visibility trade-off). |

### `ApiLayer`

```typescript
interface ApiLayer {
  buildPath?: string;
  name: string;
  layerArn?: string;
}
```

- **`name`** — identifier for the layer.
- **`buildPath`** — optional local path to build the layer from.
- **`layerArn`** — optional ARN of an existing published layer to reference.

## Examples

```typescript
import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';

export default [
  // Minimal: just the deploy target
  defineAwsServiceAccountInfo('123456789012', 'us-east-1'),

  // With a sibling service in another account and some tuning
  defineAwsServiceAccountInfo(
    '123456789012',
    'us-east-1',
    [
      { moduleName: 'billing-service', awsAccountId: '210987654321', awsRegion: 'us-east-1' },
    ],
    {
      lambdaMaxMemoryInMiB: 2048,
      disableLambdaWarming: true,
    },
  ),
];
```

## Related

- [defineAwsServiceDashboard](./aws-service-dashboard.md) and [defineAwsAlarm](./aws-alarm.md) — operational monitoring for the service defined here.
- [defineAwsVirtualNetworkSettings](./aws-virtual-network-settings.md) — VPC tuning for the same service.
