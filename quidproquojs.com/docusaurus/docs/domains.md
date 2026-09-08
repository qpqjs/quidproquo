---
title: Domains
description: How root domains, the app's hostname shape, hosted zones and certificates fit together.
---

# Domains

An app is served on one or more **root domains** and every hostname it needs is derived from them. Three things decide the final names:

1. **The root list**: [defineDns](./config/webserver/dns.md), primary first, declared by the bootstrap fragment and by every service (normally from one shared constant).
2. **The domain resolver**: the app's hostname shape, a pure `DomainResolver` export that `defineDns` points at with a `QpqPureFunction` (`{ basePath, relativePath, functionName }`). Omit the pointer for the default shape.
3. **Hosted zones** (AWS only): derived from the resolver's output, nothing to declare. A host's records go in its root's site root when it sits under it (`api.development.example.com` in the delegated `development.example.com` zone), otherwise in the root itself (`development-api.example.com` in `example.com`). Whichever applies must already exist in Route53.

## Targets

Every place that needs a host asks for a **target**, `{ subdomain?, service? }`, and gets one host per root:

| Setting | Target |
| --- | --- |
| `defineApi('api')` | `{ subdomain: 'api' }` |
| `defineWebEntry('site', { domain: { onRootDomain: true } })` | `{}` (the site root) |
| `defineWebEntry('views', { domain: { subDomainName: 'views', onRootDomain: true } })` | `{ subdomain: 'views' }` |
| `defineWebsocket('ws', ...)` on service `chat` | `{ subdomain: 'ws', service: 'chat' }` |
| CORS or CSP entry `{ api: 'admin', service: 'admin' }` | `{ subdomain: 'admin', service: 'admin' }` |

## The resolver

```typescript
// packages/domain/src/domainResolver.ts
import { DomainResolver } from 'quidproquo';

// dev-api.example.com, dev-ws-chat.example.com, example.com in production
export const domainResolver: DomainResolver = {
  resolveHost: ({ rootDomain, environment, feature, service, subdomain }) => {
    const env = environment === 'production' ? undefined : environment;
    const label = [feature, env, subdomain, service].filter(Boolean).join('-');
    return label ? `${label}.${rootDomain}` : rootDomain;
  },
};

// packages/domain/src/index.ts: the pointer every config passes to defineDns
export const DOMAIN_RESOLVER = { basePath: __dirname, relativePath: 'domainResolver', functionName: 'domainResolver' };
```

```typescript
defineDns(APP_DOMAINS, { resolver: DOMAIN_RESOLVER });
```

The resolver receives the root, environment, feature and target and returns a host that must be the root or end with `.<root>`. It can branch per root. It must be pure: no actions, no I/O, deterministic. The CDK app and the rspack builds `require` the pointer under ts-node; the lambda runtime bundles it as a src entry and loads it through the dynamic module loader once per processor (CORS, OpenAPI servers, the CloudFront origin-request domain, [askDnsResolveHosts](./actions/webserver/dns/ask-dns-resolve-hosts.md)). Nothing is precomputed and config is never rewritten: every site calls `resolveHosts(qpqConfig, target, resolver)`.

The default shape, with no pointer, is `[subdomain.][service.][feature.][environment.]root` with no environment label in production.

## The browser

Nothing here reaches the browser. How a page finds its api is the app's own concern, as before.

## Certificates

[defineDomainCertificate](./config/config-aws/domain-certificate.md) issues one certificate per region covering its targets on every root. CloudFront serves all roots from one distribution with the `us-east-1` cert; API Gateway custom domains use the deploy-region cert.

## Orphaned certificates

A certificate's names are immutable, so any change to the name set (a root added or removed, a target added, a resolver change) issues a new certificate and retains the old one until every distribution and api domain has redeployed. Retained certificates never expire away on their own. They are tagged `application` / `environment` (and `feature`), so list them per app and delete the ones nothing uses:

```bash
aws acm list-certificates --region us-east-1 \
  --query 'CertificateSummaryList[?InUseBy==`[]`].[CertificateArn,DomainName,Status]' --output table
```

## Adding a root

1. Create the Route53 zone for the new root in the deploy account.
2. Append it to the app's domain constant, which every `defineDns` reads.
3. Deploy the domain phase (new certificates, api domains), then each service.

The first root keeps the existing CloudFormation logical ids; extra roots get suffixed ones, so adding is purely additive and removing is purely deletes. Reordering the list rebuilds domain resources (aliases, records, api domain names), so do it in a quiet window.
