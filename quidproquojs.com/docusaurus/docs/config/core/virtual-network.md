---
title: defineVirtualNetwork
description: Define a virtual network — a private, isolated network (a VPC on AWS) that services and in-network data stores run inside.
---

# defineVirtualNetwork

Defines a **virtual network**: a named, private network boundary that a service's compute and in-network data stores run inside. Use it when a service needs network isolation or must reach resources that live only inside a VPC (for example a Neptune graph database). Declaring the network here is the core, platform-agnostic part; the concrete networking knobs (availability zones, NAT gateways, VPC endpoints, flow logs) are configured in the AWS config layer.

- **On AWS:** deploys a **VPC** plus a **workload security group** that every Lambda placed in the network carries (`BootstrapQpqCoreVirtualNetworkConstruct` in `@qpqjs/deploy-aws`). The security group allows all outbound traffic and no inbound — membership in the group, not mere VPC residency, is the trust boundary that in-VPC data stores allow ingress from. Depending on the AWS-side settings it also adds S3 and DynamoDB gateway endpoints, optional interface endpoints, and VPC flow logs to CloudWatch. AWS-specific tuning (max AZs, NAT gateway count, endpoints, flow-log retention/traffic type) comes from the AWS virtual-network settings in `@qpqjs/config-aws`, not from this core define.

```typescript
import { defineVirtualNetwork } from '@qpqjs/core';

export default [
  defineVirtualNetwork('private-net'),
];
```

## Signature

```typescript
function defineVirtualNetwork(
  name: string,
  options?: QPQConfigAdvancedVirtualNetworkSettings,
): VirtualNetworkQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The name of the virtual network. This is the network's `uniqueKey`, the name other config (and the AWS networking settings) reference it by, and on AWS it derives the physical VPC name and the workload security group name.

### `options` — `QPQConfigAdvancedVirtualNetworkSettings` (optional)

`QPQConfigAdvancedVirtualNetworkSettings` currently adds no fields of its own beyond the shared base:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `deprecated` | `boolean` | `false` | Marks the setting as deprecated in the config. |

The networking parameters themselves — number of availability zones, NAT gateways, gateway/interface VPC endpoints, and flow-log configuration — are set through the AWS virtual-network settings in `@qpqjs/config-aws` (resolved at deploy time by name), keeping this core define provider-agnostic.

## Examples

```typescript
import { defineVirtualNetwork } from '@qpqjs/core';

export default [
  // A private network a graph database (and its clients) can run inside
  defineVirtualNetwork('data-net'),
];
```

## Related

- [defineGraphDatabase](./graph-database.md) — an in-network data store that runs inside a virtual network and trusts its workload security group.
- [defineAwsVirtualNetworkSettings](../config-aws/aws-virtual-network-settings.md) — the AWS-specific VPC tuning (AZs, NAT, endpoints, flow logs) layered onto this core network.
- **AWS implementation:** `BootstrapQpqCoreVirtualNetworkConstruct` (VPC, workload security group, endpoints, flow logs) in `@qpqjs/deploy-aws`; AWS networking settings in `@qpqjs/config-aws`.
