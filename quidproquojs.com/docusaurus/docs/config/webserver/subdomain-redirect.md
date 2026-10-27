---
title: defineSubdomainRedirect
description: Redirect a subdomain to another URL via a small API Gateway + Lambda that issues HTTP redirects.
---

# defineSubdomainRedirect

Redirects a **subdomain** (rooted at the service's [DNS base](./dns.md)) to another URL. A common use is redirecting `www.example.com` to `example.com`, or an old subdomain to a new destination.

- **On AWS:** deploys a small redirect **Lambda** (`functionType: 'apiGatewayEventHandler_redirect'`) fronted by an **API Gateway** `LambdaRestApi` (proxy integration), plus an API Gateway custom **domain name** for the subdomain, a Route53 **`A` alias record**, and a base-path mapping (`QpqWebserverSubdomainRedirectConstruct` in `@qpqjs/deploy-awscdk`). Requests hitting the subdomain are handled by the Lambda, which responds with an HTTP redirect to `redirectUrl`. The redirect config (including `subdomain` and `redirectUrl`) is passed to the Lambda as environment. An optional Cloudflare API-key secret name is carried for Cloudflare-managed DNS setups.

```typescript
import { defineSubdomainRedirect } from '@qpqjs/webserver';

export default [
  // Redirect www.<domain> to the apex
  defineSubdomainRedirect('www', './build/redirect', 'https://example.com'),
];
```

## Signature

```typescript
function defineSubdomainRedirect(
  subdomain: string,
  apiBuildPath: string,
  redirectUrl: string,
  addEnvironment?: boolean,
  addFeatureEnvironment?: boolean,
  onRootDomain?: boolean,
  options?: QPQConfigAdvancedSubdomainRedirectSettings,
): SubdomainRedirectQPQWebServerConfigSetting;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `subdomain` | `string` | – | The subdomain to redirect from, e.g. `'www'` (the config's `uniqueKey`). |
| `apiBuildPath` | `string` | – | Build path for the redirect handler's deployable code. |
| `redirectUrl` | `string` | – | The destination URL requests are redirected to. |
| `addEnvironment` | `boolean` | `true` | Whether to include the environment prefix when building the redirect's domain. |
| `addFeatureEnvironment` | `boolean` | `true` | Whether to include the feature prefix when building the redirect's domain. |
| `onRootDomain` | `boolean` | `true` | When `true`, the subdomain hangs off the service's base domain; when `false`, off the service-scoped domain. |
| `options` | `QPQConfigAdvancedSubdomainRedirectSettings` | `{}` | Advanced settings. See below. |

### `QPQConfigAdvancedSubdomainRedirectSettings`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `cloudflareApiKeySecretName` | `string` | – | Name of a [secret](../core/secret.md) holding a Cloudflare API key, for when the redirect's DNS is managed through Cloudflare rather than Route53. |

## Examples

```typescript
import { defineSubdomainRedirect } from '@qpqjs/webserver';

export default [
  // Simple www -> apex redirect
  defineSubdomainRedirect('www', './build/redirect', 'https://example.com'),

  // Redirect an old subdomain, without env/feature prefixing, using a Cloudflare-managed zone
  defineSubdomainRedirect(
    'legacy',
    './build/redirect',
    'https://new.example.com',
    false,
    false,
    true,
    { cloudflareApiKeySecretName: 'cloudflare-api-key' },
  ),
];
```

## Related

- [defineDns](./dns.md) — declares the base domain the subdomain hangs off.
- [defineDomainProxy](./domain-proxy.md) — proxy a subdomain to another origin instead of redirecting it.
- [defineCertificate](./certificate.md) — related certificate configuration.
- [secret](../core/secret.md) — where a Cloudflare API key would be stored.
