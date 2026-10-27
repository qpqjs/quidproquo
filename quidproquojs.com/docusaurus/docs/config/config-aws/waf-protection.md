---
title: defineWafProtection
description: Opt a service's API Gateway stage and CloudFront distributions into the app's WAF web ACLs.
---

# defineWafProtection

Opts this service into the **WAF (web application firewall)** web ACLs created for the app. The web ACLs themselves are provisioned once, in the bootstrap phase, by [`defineBootstrapWaf`](./bootstrap-waf.md) (a regional ACL for API Gateway and a CloudFront ACL in `us-east-1`). This setting is what associates a service's API Gateway stage and CloudFront distributions with those ACLs. It's a separate setting because service configs and the bootstrap config are separate arrays — the ACL ARNs are resolved by convention from SSM at deploy time (so the bootstrap WAF must be deployed first).

- **On AWS:** flagged by `isWafProtectionEnabled` and consumed in `@qpqjs/deploy-aws`. `ApiQpqWebserverApiConstruct` creates a `CfnWebACLAssociation` between the API Gateway stage and the regional web ACL ARN (read from SSM); `WebQpqWebserverWebEntryConstruct` sets the CloudFront distribution's `webAclId` to the CloudFront web ACL ARN (also from SSM). Without a bootstrap WAF deployed, there are no ACL ARNs to resolve.

```typescript
import { defineWafProtection } from '@qpqjs/config-aws';

export default [
  defineWafProtection(),
];
```

## Signature

```typescript
function defineWafProtection(): WafProtectionQPQConfigSetting;
```

## Parameters

This define takes no arguments — it's a presence flag. Include it in a service's config to attach that service's API Gateway stage and CloudFront distributions to the app's WAF web ACLs; omit it to leave the service unprotected. The rule content (managed rule groups, rate limits) is configured on the bootstrap side via [`defineBootstrapWaf`](./bootstrap-waf.md), not here.

## Examples

```typescript
import { defineWafProtection } from '@qpqjs/config-aws';

// A shared service config module
export default [
  // ...other settings...
  defineWafProtection(),
];
```

## Related

- [defineBootstrapWaf](./bootstrap-waf.md) — creates the regional and CloudFront web ACLs, and configures their managed rule groups and rate limits, in the bootstrap config.
- [defineApi](../webserver/api.md) — the API Gateway stage that gets the regional ACL association.
