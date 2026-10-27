---
title: defineAwsVirtualNetworkSettings
description: Tune the AWS VPC (AZs, NAT, endpoints, flow logs) that backs a core virtual network.
---

# defineAwsVirtualNetworkSettings

Tunes the AWS **VPC** that backs a core [`defineVirtualNetwork(name)`](../core/virtual-network.md). The core define declares the network provider-agnostically; this AWS setting layers on the concrete VPC knobs — availability zones, NAT gateways, gateway/interface endpoints, and flow logs. It is secure-by-default: even when you never declare it, VPCs get flow logs to CloudWatch and the free S3/DynamoDB gateway endpoints. Declare it (keyed by the same network name) only to opt out of a default or to add interface endpoints / NAT / AZ overrides.

- **On AWS:** resolved by `getAwsVirtualNetworkSettings` (falling back to defaults when absent) and applied by `BootstrapQpqCoreVirtualNetworkConstruct` in `@qpqjs/deploy-aws`. It sets the VPC's `maxAzs` and `natGateways`, adds S3 and DynamoDB gateway endpoints unless disabled, adds any requested interface endpoints (one ENI per AZ, private DNS on), and — unless disabled — creates a flow-log group at `/qpq/vpc-flow-logs/{vpcName}` with the requested retention and traffic type.

```typescript
import { defineVirtualNetwork } from '@qpqjs/core';
import { defineAwsVirtualNetworkSettings } from '@qpqjs/config-aws';

export default [
  defineVirtualNetwork('private-net'),

  // Cheaper non-prod VPC: a single NAT gateway
  defineAwsVirtualNetworkSettings('private-net', {
    natGateways: 1,
  }),
];
```

## Signature

```typescript
function defineAwsVirtualNetworkSettings(
  virtualNetworkName: string,
  options?: QPQConfigAdvancedAwsVirtualNetworkSettings,
): AwsVirtualNetworkQPQConfigSetting;
```

## Parameters

### `virtualNetworkName` — `string` (required)

The name of the core virtual network these settings apply to — it must match the name passed to `defineVirtualNetwork`. This is also the setting's `uniqueKey`.

### `options` — `QPQConfigAdvancedAwsVirtualNetworkSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `flowLogs` | `AwsVirtualNetworkFlowLogSettings` | flow logs on | VPC flow-log configuration. See [Flow logs](#flow-logs). |
| `disableS3GatewayEndpoint` | `boolean` | `false` | Skip the free S3 gateway endpoint. Only disable if you have custom route-table requirements. |
| `disableDynamoDbGatewayEndpoint` | `boolean` | `false` | Skip the free DynamoDB gateway endpoint. |
| `interfaceEndpoints` | `string[]` | `[]` | AWS service short names to add interface endpoints for, e.g. `['secretsmanager', 'kms']` — resolved to `com.amazonaws.{region}.{name}`. Each costs roughly US$7.30/mo per AZ (~$14.60/mo at the default `maxAzs` 2) plus $0.01/GB, in exchange for that service's traffic never leaving the VPC (and not being billed through NAT). |
| `natGateways` | `number` | CDK default (one per AZ) | Number of NAT gateways. `undefined` leaves the CDK default untouched (no subnet/NAT churn on already-deployed VPCs). Set to `1` to halve cost in non-prod (trading AZ redundancy for egress). **`0` is rejected** — qpq Lambdas are placed in `PRIVATE_WITH_EGRESS` subnets, which don't exist in a NAT-less VPC (passing `0` throws). Changing this on a deployed VPC replaces its subnets. |
| `maxAzs` | `number` | `2` | Number of availability zones. Changing this on a deployed VPC replaces its subnets. |

### Flow logs

`AwsVirtualNetworkFlowLogSettings`:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `disable` | `boolean` | `false` | Turn flow logs off. Flow logs are on unless disabled; CloudWatch ingestion is ~US$0.50/GB (typically cents-to-dollars/month for Lambda-only VPCs). |
| `retentionDays` | `number` | `365` | CloudWatch log-group retention, rounded **up** to the nearest supported `RetentionDays` value at deploy time. |
| `trafficType` | `AwsVpcFlowLogTrafficType` | `all` | Which traffic to record. |

**`AwsVpcFlowLogTrafficType`:** `all`, `accept`, `reject`.

## Examples

```typescript
import { defineVirtualNetwork } from '@qpqjs/core';
import { defineAwsVirtualNetworkSettings, AwsVpcFlowLogTrafficType } from '@qpqjs/config-aws';

export default [
  defineVirtualNetwork('data-net'),

  defineAwsVirtualNetworkSettings('data-net', {
    maxAzs: 3,
    // Keep Secrets Manager & KMS traffic inside the VPC
    interfaceEndpoints: ['secretsmanager', 'kms'],
    flowLogs: {
      retentionDays: 30,
      trafficType: AwsVpcFlowLogTrafficType.reject,
    },
  }),
];
```

## Related

- [defineVirtualNetwork](../core/virtual-network.md) — the core, provider-agnostic network these settings tune. Declare both, keyed by the same name.
- [defineGraphDatabase](../core/graph-database.md) — an in-network data store that runs inside the tuned VPC.
