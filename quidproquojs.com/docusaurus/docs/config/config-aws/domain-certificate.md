---
title: defineDomainCertificate
description: Issue one DNS-validated ACM certificate per region covering the app's hosts on every root domain.
---

# defineDomainCertificate

Issues a real **ACM (AWS Certificate Manager) certificate** for a region, covering a set of host targets on **every** root declared with [defineDns](../webserver/dns.md). This is the certificate API Gateway and CloudFront use for HTTPS.

- **On AWS:** each region becomes one `DomainCertificateStack` (via `createDomainCertificateStacks` in `quidproquo-deploy-awscdk`). Every target is resolved on every root through the app's [domain resolver](../../domains.md), each name is DNS-validated in its own hosted zone (`CertificateValidation.fromDnsMultiZone`), and the ARN is published to SSM under an app-keyed parameter (`/qpq/domain/certificate-arn/<region>/<app>-<environment>[-<feature>]`), cross-region via a custom resource when the cert region differs from the deploy region. The certificate is **retained** on replacement: changing the name set issues a new cert while distributions still referencing the old ARN keep working until they redeploy. Entries for the same region are merged. ACM allows 10 names per certificate by default; synth fails with the name list when a config exceeds it.

```typescript
import { defineDomainCertificate } from 'quidproquo-config-aws';

export default ({ region }) => [
  // CloudFront: the site root plus www on every root
  defineDomainCertificate('us-east-1', [{ subdomain: 'www' }], { includeApex: true }),

  // Regional API Gateway: the api and a service-scoped websocket
  defineDomainCertificate(region, [{ subdomain: 'api' }, { subdomain: 'ws', service: 'chat' }]),
];
```

## Signature

```typescript
function defineDomainCertificate(
  region: string,
  targets: DomainTarget[],
  options?: { includeApex?: boolean },
): DomainCertificateQPQConfigSetting;
```

## Parameters

### `region` — `string` (required)

The AWS region to issue the certificate in. CloudFront requires `us-east-1`; regional API Gateway custom domains need the deploy region. It is the setting's `uniqueKey`, so entries for one region merge.

### `targets` — `DomainTarget[]` (required)

The hosts to cover, as `{ subdomain?, service? }` targets. Each is resolved on every root with the app's domain resolver, exactly as the api, web entry or websocket that uses it will be. `{ subdomain: 'api' }` covers the api host; `{ subdomain: 'ws', service: 'chat' }` covers a websocket that is not `onRootDomain`.

### `options` — `{ includeApex?: boolean }` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `includeApex` | `boolean` | `false` | Also cover each root's site root (the `{}` target), which a web entry with `onRootDomain: true` and no subdomain serves on. |

## Related

- [Domains](../../domains.md) — the resolver every target goes through.
- [defineDns](../webserver/dns.md) — the roots the certificate covers.
