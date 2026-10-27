---
title: defineBootstrapWaf
description: Bootstrap the shared AWS WAF web ACLs (regional + CloudFront) for an app/environment that services opt into.
---

# defineBootstrapWaf

Bootstraps the **shared AWS WAF (WAFv2) web ACLs** for an app + environment: a REGIONAL web ACL (for API Gateway stages) and a CLOUDFRONT web ACL (for CloudFront distributions). Both evaluate the same set of rules. Individual services then opt into protection with `defineWafProtection` in their config.

This is a **bootstrap setting**: it is created once during the bootstrap phase for the whole app/environment rather than per-service. It is declared in a bootstrap config and deployed by the bootstrap stack (`BootstrapQpqServiceStack`). There is a single `defineBootstrapWaf` per config (its `uniqueKey` is the constant `'bootstrapWaf'`).

- **On AWS:** deploys two `aws_wafv2.CfnWebACL`s with `defaultAction: allow` and shared rules. The REGIONAL ACL (`qpq-waf-regional-<app>-<env>`) is created by `QpqBootstrapConfigWafConstruct` in the bootstrap stack and publishes its ARN to SSM; each service's API stack attaches via a `WebACLAssociation`. The CLOUDFRONT ACL (`qpq-waf-cloudfront-<app>-<env>`) must live in `us-east-1`, so it is a sibling stack (`WafCloudFrontWebAclStack`) that hands its ARN back to the deploy region via SSM (directly if deploying to `us-east-1`, otherwise via a cross-region `AwsCustomResource`). CloudWatch metrics and sampled requests are enabled on every rule.

```typescript
import { defineBootstrapWaf } from '@qpqjs/config-aws';

export default [
  defineBootstrapWaf(),
];
```

## Signature

```typescript
function defineBootstrapWaf(
  options?: {
    managedRuleGroups?: WafManagedRuleGroup[];
    rateLimits?: WafRateLimit[];
    managedRuleOverrides?: Partial<Record<WafManagedRuleGroup, WafManagedRuleOverride[]>>;
  },
): BootstrapWafQPQConfigSetting;
```

## Parameters

### `options` — (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `managedRuleGroups` | `WafManagedRuleGroup[]` | `[common, knownBadInputs, sqli]` | AWS-managed rule groups to enable, each added as a managed-rule-group statement with `overrideAction: none`. See [`WafManagedRuleGroup`](#wafmanagedrulegroup). |
| `rateLimits` | `WafRateLimit[]` | `[]` (none) | Rate-based blocking rules (e.g. brute-force throttling on auth endpoints). Evaluated **before** the managed rule groups. See [`WafRateLimit`](#wafratelimit). |
| `managedRuleOverrides` | `Partial<Record<WafManagedRuleGroup, WafManagedRuleOverride[]>>` | `undefined` (none) | Per-rule action overrides within a managed group, e.g. force a specific rule to `count` instead of the group's default blocking action. See [`WafManagedRuleOverride`](#wafmanagedruleoverride). |

### `WafManagedRuleGroup`

```typescript
export enum WafManagedRuleGroup {
  common = 'common',                 // AWSManagedRulesCommonRuleSet
  knownBadInputs = 'knownBadInputs', // AWSManagedRulesKnownBadInputsRuleSet
  sqli = 'sqli',                     // AWSManagedRulesSQLiRuleSet
  ipReputation = 'ipReputation',     // AWSManagedRulesAmazonIpReputationList
}
```

| Member | AWS managed rule set |
| --- | --- |
| `common` | `AWSManagedRulesCommonRuleSet` — broad OWASP-style protections. |
| `knownBadInputs` | `AWSManagedRulesKnownBadInputsRuleSet` — blocks request patterns known to be malicious. |
| `sqli` | `AWSManagedRulesSQLiRuleSet` — SQL-injection protections. |
| `ipReputation` | `AWSManagedRulesAmazonIpReputationList` — Amazon IP reputation list. |

### `WafRateLimit`

```typescript
export interface WafRateLimit {
  name: string;
  limit: number;
  uriPathStartsWith?: string;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Rule name (used to build the WAF rule and metric names, e.g. `rate-limit-<name>`). |
| `limit` | `number` | Maximum requests per 5-minute window per source IP before that IP is blocked (`aggregateKeyType: IP`). |
| `uriPathStartsWith` | `string` | Optional. Scope the rate limit to URI paths with this prefix (e.g. `/auth`) via a scope-down byte-match statement. Omit to rate limit all paths. |

### `WafManagedRuleOverride`

```typescript
export interface WafManagedRuleOverride {
  name: string;
  action: WafRuleOverrideAction;
}

export enum WafRuleOverrideAction {
  count = 'count', // Observe and emit metrics for matching requests, but never block them.
}
```

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Rule name inside the managed group, e.g. `'SizeRestrictions_BODY'`. |
| `action` | `WafRuleOverrideAction` | Action to force for this rule instead of the group's default. Currently only `count` (observe without blocking) is supported. |

## Notes

- Rate-limit rules are given the lowest priorities (evaluated first as cheap counters), then the managed rule groups follow.
- To actually apply these ACLs, a service opts in with `defineWafProtection()` in its (shared) service config; the ACL ARNs are resolved by convention from SSM at deploy time, so the bootstrap must be deployed before the service's API/web stacks.
- `managedRuleOverrides` is keyed by `WafManagedRuleGroup`; overrides for a group only apply if that group is also present in `managedRuleGroups`.

## Examples

```typescript
import { defineBootstrapWaf, WafManagedRuleGroup } from '@qpqjs/config-aws';

export default [
  defineBootstrapWaf({
    managedRuleGroups: [
      WafManagedRuleGroup.common,
      WafManagedRuleGroup.knownBadInputs,
      WafManagedRuleGroup.sqli,
      WafManagedRuleGroup.ipReputation,
    ],
    rateLimits: [
      { name: 'auth-brute-force', limit: 100, uriPathStartsWith: '/auth' },
      { name: 'global', limit: 5000 },
    ],
  }),
];
```

To let large request bodies through instead of being blocked by the `common` group's default 8kb body-size limit:

```typescript
import { defineBootstrapWaf, WafManagedRuleGroup, WafRuleOverrideAction } from '@qpqjs/config-aws';

export default [
  defineBootstrapWaf({
    managedRuleGroups: [WafManagedRuleGroup.common, WafManagedRuleGroup.knownBadInputs, WafManagedRuleGroup.sqli],
    managedRuleOverrides: {
      [WafManagedRuleGroup.common]: [{ name: 'SizeRestrictions_BODY', action: WafRuleOverrideAction.count }],
    },
  }),
];
```

## Related

- [defineWafProtection](./waf-protection.md) — a per-service setting that opts a service's API Gateway stage and CloudFront distributions into these web ACLs.
- [defineBootstrapAwsOrganization](./bootstrap-aws-organization.md) — another bootstrap-phase setting deployed by the same `BootstrapQpqServiceStack`.
- **AWS implementation:** `QpqBootstrapConfigWafConstruct` (regional ACL) and `WafCloudFrontWebAclStack` (CloudFront ACL in us-east-1), with shared rule building in `wafRules.ts`, in `@qpqjs/deploy-awscdk`.
