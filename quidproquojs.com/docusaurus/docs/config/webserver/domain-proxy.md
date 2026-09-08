---
title: defineDomainProxy
description: Front a domain with a CloudFront distribution that proxies all requests to another HTTP origin.
---

# defineDomainProxy

Puts a **CloudFront distribution** in front of a domain (rooted at the service's [DNS base](./dns.md)) and proxies every request through to another HTTP origin. Use it to serve an external or internal backend under your own domain with HTTPS, optional caching, and optional WAF protection.

- **On AWS:** deploys an `aws_cloudfront.Distribution` (`WebQpqWebserverDomainProxyConstruct` in `quidproquo-deploy-awscdk`) whose default behaviour points at an `HttpOrigin` for `httpProxyDomain`, forwards all viewer headers/methods, and applies the chosen viewer-protocol policy. It attaches the requested custom domain names, a looked-up ACM certificate (from the central certificate stack), a cache policy (named cache config or caching-disabled), and — when WAF is enabled for the service — the shared CloudFront web ACL. It then creates a Route53 **`A` alias record** per domain name pointing at the distribution, and adds a caching-disabled behaviour for each `ignoreCache` path pattern.

```typescript
import { defineDomainProxy, DomainProxyViewerProtocolPolicy } from 'quidproquo-webserver';

export default [
  defineDomainProxy('marketing-proxy', {
    httpProxyDomain: 'origin.internal.example.com',
    domain: {
      onRootDomain: true,
    },
    domainProxyViewerProtocolPolicy: DomainProxyViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  }),
];
```

## Signature

```typescript
function defineDomainProxy(
  name: string,
  options: QPQConfigAdvancedDomainProxySettings,
): DomainProxyQPQWebServerConfigSetting;
```

## Parameters

### `name` — `string` (required)

Unique name for this proxy (the config's `uniqueKey`). Used to derive the distribution's export name.

### `options` — `QPQConfigAdvancedDomainProxySettings` (required)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `httpProxyDomain` | `string` | – | The origin hostname CloudFront forwards requests to (the backend being proxied). |
| `domain` | `DomainProxyDomainOptions` | – | Which domain names the distribution answers on. See [Domain options](#domain-options). |
| `domainProxyViewerProtocolPolicy` | `DomainProxyViewerProtocolPolicy` | – | How CloudFront treats HTTP vs HTTPS from viewers. See [Viewer protocol policy](#viewer-protocol-policy). |
| `cacheSettingsName` | `string` | – | Name of a cache config (declared elsewhere in the service) to use as the distribution's cache policy. When omitted, caching is disabled. |
| `ignoreCache` | `string[]` | `[]` | Path patterns that always bypass the cache — each becomes an extra CloudFront behaviour with caching disabled. |

### Domain options

```typescript
export interface DomainProxyDomainOptions {
  subDomainNames?: string[];
  onRootDomain: boolean;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `subDomainNames` | `string[]` | Subdomains to serve, each expanded to `<subDomain>.<apex>`. An `A` alias record is created for each. |
| `onRootDomain` | `boolean` | When `true` and no subdomains are given, the distribution also answers on the apex domain itself. |

### Viewer protocol policy

```typescript
export enum DomainProxyViewerProtocolPolicy {
  HTTPS_ONLY = 'https-only',
  REDIRECT_TO_HTTPS = 'redirect-to-https',
  ALLOW_ALL = 'allow-all',
}
```

| Member | Meaning |
| --- | --- |
| `HTTPS_ONLY` | Serve HTTPS only; reject plain HTTP. |
| `REDIRECT_TO_HTTPS` | Redirect HTTP requests to HTTPS. |
| `ALLOW_ALL` | Accept both HTTP and HTTPS. |

## Examples

```typescript
import { defineDomainProxy, DomainProxyViewerProtocolPolicy } from 'quidproquo-webserver';

export default [
  // Proxy specific subdomains, HTTPS only, with a named cache config and a bypass path
  defineDomainProxy('api-proxy', {
    httpProxyDomain: 'backend.example.net',
    domain: {
      subDomainNames: ['api', 'api-v2'],
      onRootDomain: false,
    },
    domainProxyViewerProtocolPolicy: DomainProxyViewerProtocolPolicy.HTTPS_ONLY,
    cacheSettingsName: 'short-cache',
    ignoreCache: ['/health', '/webhooks/*'],
  }),
];
```

## Related

- [defineDns](./dns.md) — declares the roots this proxy is served on.
- [defineCertificate](./certificate.md) — related certificate configuration (the proxy uses the central certificate).
- [defineSubdomainRedirect](./subdomain-redirect.md) — redirect a subdomain instead of proxying it.
