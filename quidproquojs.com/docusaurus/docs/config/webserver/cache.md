---
title: defineCache
description: Define a named CDN cache policy (TTLs) that web entries and SEO routes reference by name.
---

# defineCache

Defines a named **cache policy** — a set of CDN cache TTLs — that other web settings reference by name. A [web entry](./web-entry.md) applies it via `cacheSettingsName`, and a [defineSeo](./seo.md) route can reference its own cache policy the same way. Declaring caching once and referencing it by name keeps a consistent policy across behaviors.

- **On AWS:** deploys a CloudFront `CachePolicy` (`QpqWebServerCacheConstruct` in `quidproquo-deploy-awscdk`) with the configured min/default/max TTLs. The policy caches on an allow-list of headers — `x-qpq-is-bot` (so bot vs. human responses cache separately, which pairs with SEO edge rendering) plus the CORS request headers (`Origin`, `Access-Control-Request-Headers`, `Access-Control-Request-Method`) — and enables gzip and brotli. The policy id is exported so web entries in other stacks can attach it.

```typescript
import { defineCache } from 'quidproquo-webserver';

export default [
  defineCache('default', {
    minTTLInSeconds: 0,
    defaultTTLInSeconds: 86400,
    maxTTLInSeconds: 31536000,
    mustRevalidate: false,
  }),
];
```

## Signature

```typescript
function defineCache(
  name: string,
  cache: CacheSettings,
  options?: QPQConfigAdvancedCacheSettings,
): CacheQPQWebServerConfigSetting;
```

## Parameters

### `name` — `string` (required)

The cache policy's name and `uniqueKey`. This is the value other settings pass as `cacheSettingsName`.

### `cache` — `CacheSettings` (required)

```typescript
export interface CacheSettings {
  minTTLInSeconds: number;
  maxTTLInSeconds: number;
  defaultTTLInSeconds: number;
  mustRevalidate: boolean;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `minTTLInSeconds` | `number` | Minimum time an object stays cached before the CDN checks origin for a newer version. |
| `defaultTTLInSeconds` | `number` | Time an object is cached when origin sends no `Cache-Control`/`Expires` directive of its own. |
| `maxTTLInSeconds` | `number` | Maximum time an object stays cached, capping any longer TTL requested by origin headers. |
| `mustRevalidate` | `boolean` | Intended to require revalidation of stale content. **Note:** this field is not currently applied by the AWS cache construct (the TTLs above drive caching); set it for forward-compatibility but rely on the TTLs for behavior today. |

### `options` — `QPQConfigAdvancedCacheSettings` (optional)

| Property | Type | Description |
| --- | --- | --- |
| `owner` | `CrossModuleOwner<'cacheName'>` | Declares that this cache policy is owned by **another** module/service, so this service references the policy deployed there instead of creating a new one. |
| `deprecated` | `boolean` | Standard advanced-settings flag marking the policy as deprecated. |

## Examples

```typescript
import { defineCache, defineWebEntry } from 'quidproquo-webserver';

export default [
  // Cache aggressively by default, but bypass the SPA shell so deploys land instantly
  defineCache('default', {
    minTTLInSeconds: 0,
    defaultTTLInSeconds: 86400,
    maxTTLInSeconds: 31536000,
    mustRevalidate: false,
  }),

  defineWebEntry('website', {
    buildPath: './web/dist',
    cacheSettingsName: 'default',
    ignoreCache: ['index.html'],
    domain: { onRootDomain: true },
  }),
];
```

## Related

- [defineWebEntry](./web-entry.md) — applies a cache policy via `cacheSettingsName` and lists `ignoreCache` bypass patterns.
- [defineSeo](./seo.md) — SEO routes can reference their own cache policy by name.
- [askWebEntryInvalidateCache](../../actions/webserver/web-entry/ask-web-entry-invalidate-cache.md) — force cached objects to be re-fetched before their TTL expires.
- **AWS implementation:** `QpqWebServerCacheConstruct` (CloudFront `CachePolicy`) in `quidproquo-deploy-awscdk`.
