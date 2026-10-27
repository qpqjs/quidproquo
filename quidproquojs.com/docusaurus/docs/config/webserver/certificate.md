---
title: defineCertificate
description: Legacy declaration of a TLS certificate for a domain — kept for backwards compatibility; certificates are now provisioned centrally.
---

# defineCertificate

Declares a TLS certificate for a domain rooted at a service's [DNS base](./dns.md).

:::warning Legacy / no-op on AWS
`defineCertificate` is kept only for **backwards compatibility**. Its AWS construct (`QpqWebserverCertificateConstruct`) is now a no-op shim that creates no resources. Certificates are provisioned centrally by the deploy pipeline via `defineDomainCertificate` (in the bootstrap config) and are consumed by service constructs through an internal SSM lookup. New configs should rely on that central certificate rather than calling `defineCertificate`.
:::

- **On AWS:** nothing. The central `DomainCertificateStack` creates an **ACM certificate** with **DNS validation** against the existing Route53 hosted zone, then publishes its ARN to SSM so API Gateway custom domains and [CloudFront domain proxies](./domain-proxy.md) can look it up. `defineCertificate` itself no longer participates in that.

```typescript
import { defineCertificate } from '@qpqjs/webserver';

export default [
  // Legacy: certificate covering a subdomain of the service's DNS base
  defineCertificate(false, 'example.com', 'app'),
];
```

## Signature

```typescript
function defineCertificate(
  onRootDomain: boolean,
  rootDomain: string,
  subdomain?: string,
  options?: QPQConfigAdvancedCertificateSettings,
): CertificateQPQWebServerConfigSetting;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `onRootDomain` | `boolean` | – | Whether the certificate is issued against the shared root domain rather than the service's own subdomain. Combined with `subdomain` it forms the config's `uniqueKey`. |
| `rootDomain` | `string` | – | The root domain the certificate belongs to (matches the service's [`dnsBase`](./dns.md)). |
| `subdomain` | `string` | – | Optional subdomain the certificate covers. |
| `options` | `QPQConfigAdvancedCertificateSettings` | – | Advanced settings. Currently an empty interface (it extends the shared `QPQConfigAdvancedSettings`, e.g. cross-module `owner`), reserving room for future options. |

## Examples

```typescript
import { defineCertificate } from '@qpqjs/webserver';

export default [
  // Certificate on the root domain
  defineCertificate(true, 'example.com'),

  // Certificate for a specific subdomain
  defineCertificate(false, 'example.com', 'admin'),
];
```

## Related

- [defineDns](./dns.md) — declares the `rootDomain` this certificate is rooted at.
- [defineDomainProxy](./domain-proxy.md) — a CloudFront proxy that consumes the central certificate for its domain.
- [defineSubdomainRedirect](./subdomain-redirect.md) — related domain-level configuration.
- [defineDomainCertificate](../config-aws/domain-certificate.md) — the real ACM certificate (with DNS validation) this portable shim defers to on AWS.
