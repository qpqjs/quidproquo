---
title: defineWebEntry
description: Host a static web app / SPA — its build output is served from a CDN-backed storage bucket on your domain.
---

# defineWebEntry

Defines a **web entry**: a hosted static web app (a single-page app or any static site) served on a domain through a CDN. The build output is uploaded to a storage bucket and served through a CDN distribution, with an SPA fallback so client-side routes resolve to your app shell.

- **On AWS:** deploys an S3 bucket (private, versioned, all public access blocked) as the origin and a CloudFront distribution in front of it (`WebQpqWebserverWebEntryConstruct` in `quidproquo-deploy-awscdk`). CloudFront reads the bucket via Origin Access Control, redirects HTTP to HTTPS, optionally compresses responses, and serves the certificate for your domain (an ACM certificate looked up in `us-east-1`). A Route 53 A-record aliases your (sub)domain to the distribution. `404`/`403` responses are rewritten to `200` served from `/` — the **SPA fallback** that lets client-side routing handle deep links. When WAF protection is enabled for the app, the shared CloudFront web ACL is attached. If `autoUpload` is on, the build output is uploaded to the bucket on every deploy.

```typescript
import { defineWebEntry } from 'quidproquo-webserver';

export default [
  defineWebEntry('website', {
    buildPath: './web/dist',
    domain: {
      onRootDomain: true,
    },
  }),
];
```

## Signature

```typescript
function defineWebEntry(
  name: string,
  options: QPQConfigAdvancedWebEntrySettings,
): WebEntryQPQWebServerConfigSetting;
```

## Parameters

### `name` — `string` (required)

The web entry's name and `uniqueKey`. This is the name you pass to [askWebEntryInvalidateCache](../../actions/webserver/web-entry/ask-web-entry-invalidate-cache.md), and on AWS it is used to derive the bucket name and the distribution's CloudFormation export.

### `options` — `QPQConfigAdvancedWebEntrySettings` (required)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `domain` | `WebDomainOptions` | – | **Required.** The domain to serve the app on — see [WebDomainOptions](#webdomainoptions). |
| `buildPath` | `string` | – | Local path to the built static assets to upload to the origin bucket (used when `storageDrive.autoUpload` is on). |
| `storageDrive` | `StorageDriveOptions` | `{ autoUpload: true }` | Where the assets live / how they are uploaded — see [StorageDriveOptions](#storagedriveoptions). |
| `indexRoot` | `string` | `'index.html'` | The default root object served for `/` (CloudFront `defaultRootObject`). |
| `cacheSettingsName` | `string` | – | Name of a [defineCache](./cache.md) policy to apply to the default behavior. When omitted, caching is disabled at the CDN (every request hits origin). |
| `ignoreCache` | `string[]` | `[]` | Path patterns that bypass the cache — each becomes a CDN behavior with caching disabled. Use for files that must never be stale, e.g. `['index.html', 'remoteEntry.js', 'mf-manifest.json']`. |
| `compressFiles` | `boolean` | `true` | Whether the CDN compresses responses (gzip/brotli). |
| `securityHeaders` | `ResponseSecurityHeaders` | – | Security-related HTTP response headers (CSP, HSTS, frame options, etc.) attached via a CDN response-headers policy — see [ResponseSecurityHeaders](#responsesecurityheaders). |
| `corsAllowedOrigins` | `string[]` | service's own domain | Browser origins allowed to cross-origin `fetch` this web entry's static assets. Omit to scope to this service's own domain (`https://<domain>` and `https://*.<domain>`); pass `['*']` to allow any origin (e.g. serving assets as a public CDN or cross-origin fonts). |
| `cloudflareApiKeySecretName` | `string` | – | Name of a [secret](../core/secret.md) holding a Cloudflare API key, for setups whose DNS is managed through Cloudflare rather than Route 53. |
| `deprecated` | `boolean` | `false` | Standard advanced-settings flag marking the entry as deprecated. |

### `WebDomainOptions`

```typescript
export interface WebDomainOptions {
  subDomainName?: string;
  onRootDomain: boolean;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `onRootDomain` | `boolean` | Serve on the apex domain itself (`example.com`). |
| `subDomainName` | `string` (optional) | Serve on a subdomain instead of / in addition to the apex, e.g. `'app'` → `app.example.com`. |

### `StorageDriveOptions`

```typescript
export interface StorageDriveOptions {
  sourceStorageDrive?: string;
  autoUpload: boolean;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `autoUpload` | `boolean` | When `true`, the assets at `buildPath` are uploaded to the origin bucket on every deploy. Set `false` when something else (e.g. a separate publish step) populates the bucket. |
| `sourceStorageDrive` | `string` (optional) | Serve the app from an **existing** [storage drive](../core/storage-drive.md) (by name) instead of a dedicated bucket created for this web entry. When set, that drive's bucket is used as the CDN origin. |

### `ResponseSecurityHeaders`

Optional security headers the CDN adds to responses. Every sub-object has an `override` boolean (whether to override the header received from origin). All are optional; anything omitted is simply not sent.

| Property | Type | Description |
| --- | --- | --- |
| `contentSecurityPolicy` | `ResponseHeadersContentSecurityPolicy` | `Content-Security-Policy` directives — a `Record<string, ContentSecurityPolicyEntry[]>` where an entry is either a raw string or a `QpqServiceContentSecurityPolicy` describing another service by `{ api, domain?, service?, protocol? }`. |
| `contentTypeOptions` | `ResponseHeadersContentTypeOptions` | Sends `X-Content-Type-Options: nosniff`. |
| `frameOptions` | `ResponseHeadersFrameOptions` | `X-Frame-Options` — `frameOption` is `HeadersFrameOption.DENY` or `HeadersFrameOption.SAMEORIGIN`. |
| `referrerPolicy` | `ResponseHeadersReferrerPolicy` | `Referrer-Policy` — `referrerPolicy` is a `HeadersReferrerPolicy` member (e.g. `SAME_ORIGIN`, `STRICT_ORIGIN_WHEN_CROSS_ORIGIN`). |
| `strictTransportSecurity` | `ResponseHeadersStrictTransportSecurity` | HSTS — `accessControlMaxAgeInSeconds`, plus optional `includeSubdomains` and `preload`. |
| `xssProtection` | `ResponseHeadersXSSProtection` | `X-XSS-Protection` — `protection`, optional `modeBlock`, and optional `reportUri`. |

## Examples

```typescript
import { defineStorageDrive } from 'quidproquo-core';
import { defineWebEntry, QPQConfigAdvancedWebEntrySettings } from 'quidproquo-webserver';

// Simple SPA on the apex domain, assets uploaded on deploy
export default [
  defineWebEntry('website', {
    buildPath: './web/dist',
    cacheSettingsName: 'default',
    // The SPA shell and module-federation manifests must never be served stale
    ignoreCache: ['index.html', 'remoteEntry.js', 'mf-manifest.json'],
    domain: {
      onRootDomain: true,
    },
  }),
];
```

```typescript
// Serve a web app from an existing storage drive, populated by a separate step
const options: QPQConfigAdvancedWebEntrySettings = {
  buildPath: './web/dist',
  cacheSettingsName: 'default',
  domain: {
    subDomainName: 'views',
    onRootDomain: false,
  },
  storageDrive: {
    sourceStorageDrive: 'views',
    autoUpload: false,
  },
};

export default [
  defineStorageDrive('views'),
  defineWebEntry('views', options),
];
```

## Related

- [defineCache](./cache.md) — the CDN cache policy referenced by `cacheSettingsName`.
- [defineSeo](./seo.md) — server-side (Lambda@Edge) rendering attached to a web entry's paths, for crawlers/social previews.
- [defineStorageDrive](../core/storage-drive.md) — the drive referenced by `storageDrive.sourceStorageDrive`.
- [defineStorageDriveCorsSettings](./storage-drive-cors-settings.md) — browser CORS for a storage drive's own objects (as opposed to `corsAllowedOrigins` here, which covers this web entry's assets).
- [askWebEntryInvalidateCache](../../actions/webserver/web-entry/ask-web-entry-invalidate-cache.md) — drop cached assets after a deploy.
- **AWS implementation:** `WebQpqWebserverWebEntryConstruct` (S3 origin, CloudFront distribution, OAC, Route 53 alias, security headers, SEO edge lambdas) in `quidproquo-deploy-awscdk`.
