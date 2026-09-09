---
title: defineDns
description: Declare the root domains a service is served on; every hostname the service deploys is derived from them.
---

# defineDns

Declares the **root domains** for a service, primary first. Everything else that needs a hostname (API custom domains, web entries, websockets, [domain proxies](./domain-proxy.md), [subdomain redirects](./subdomain-redirect.md), email identities, CORS and CSP origins) is derived from this list through the app's [domain resolver](../../domains.md). A service has one `defineDns`; a second one is a synth error.

- **On AWS:** `defineDns` does **not** create a Route53 hosted zone. Deploy constructs look zones up with `HostedZone.fromLookup` and add records into them. A host's zone is its root's site root when it sits under it (`api.development.example.com` in `development.example.com`), otherwise the root itself (`development-api.example.com` in `example.com`); see [Domains](../../domains.md).

```typescript
import { defineDns } from 'quidproquo-webserver';

export default [
  defineDns(['example.com', 'example.org'], {
    resolver: { basePath: __dirname, relativePath: 'domainResolver', functionName: 'domainResolver' },
  }),
];
```

## Signature

```typescript
function defineDns(
  rootDomains: string | string[],
  options?: { resolver?: QpqPureFunction },
): DnsQPQWebServerConfigSetting;
```

## Parameters

### `rootDomains` — `string | string[]` (required)

The root domains the service is served on. The first is the **primary**: anything that must bake exactly one absolute URL (email links, module-federation remotes, the Cognito custom domain) uses it. Every other resource is created on every root, so the app is fully live on all of them at once.

Hostnames are not built here. They come from the app's [domain resolver](../../domains.md), which by default produces `[subdomain.][service.][feature.][environment.]root` with no environment label in production.

### `options.resolver` — `QpqPureFunction` (optional)

A pointer (`{ basePath, relativePath, functionName }`) to the app's `DomainResolver` export. The deploy tooling `require`s it at synth and build time, and the runtime loads it through the dynamic module loader (the pointer is a bundled src entry like a route), so every site resolves hosts the same way: `resolveHosts(qpqConfig, target, resolver)`. Omit it for the default shape.

## Examples

```typescript
import { defineDns } from 'quidproquo-webserver';

export default [
  // One root
  defineDns('example.com'),

  // Two roots, example.com primary: every api, web entry and websocket is served on both,
  // shaped by the app's own resolver
  defineDns(['example.com', 'example.org'], {
    resolver: { basePath: __dirname, relativePath: 'domainResolver', functionName: 'domainResolver' },
  }),
];
```

## Related

- [Domains](../../domains.md) — how roots, the resolver, zones and certificates fit together.
- [askDnsList](../../actions/webserver/dns/ask-dns-list.md) — returns the root list at runtime.
- [askDnsResolveHosts](../../actions/webserver/dns/ask-dns-resolve-hosts.md) — a target's host on every root at runtime.
- [defineDomainCertificate](../config-aws/domain-certificate.md) — the per-region certificate covering every root.
