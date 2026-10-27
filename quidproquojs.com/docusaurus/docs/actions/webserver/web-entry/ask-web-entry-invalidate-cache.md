---
title: askWebEntryInvalidateCache
description: Invalidate the CDN cache for a hosted web entry so viewers pick up freshly deployed assets.
---

# askWebEntryInvalidateCache

Invalidates the CDN cache for a [web entry](../../../config/webserver/web-entry.md) so that cached copies of the given paths are dropped and the next request re-fetches them from origin. Use this after uploading a new build to a web entry's storage drive, so viewers see the new assets without waiting for the [cache](../../../config/webserver/cache.md) TTL to expire.

- **Action type:** `WebEntryActionType.InvalidateCache`
- **On AWS:** looks up the CloudFront distribution deployed for the named web entry (via its CloudFormation export) and issues a CloudFront `CreateInvalidation` for the supplied paths. The caller reference is derived from a hash of the paths plus the current timestamp, so repeated invalidations of the same paths are always accepted as distinct requests.

```typescript
import { askWebEntryInvalidateCache } from '@qpqjs/webserver';

export function* askPublishSite() {
  // Drop the SPA shell and manifest so a new deploy is served immediately
  yield* askWebEntryInvalidateCache('website', '/index.html', '/mf-manifest.json');
}
```

Passing no paths issues an invalidation with an empty path set (nothing is invalidated); pass `'/*'` to invalidate everything the distribution has cached.

## Signature

```typescript
function* askWebEntryInvalidateCache(
  webEntryName: string,
  ...paths: string[]
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `webEntryName` | `string` | Name of the web entry to invalidate — must match the `name` passed to [defineWebEntry](../../../config/webserver/web-entry.md). This resolves to that web entry's CDN distribution. |
| `...paths` | `string[]` | One or more path patterns to invalidate, each a leading-slash absolute path (e.g. `'/index.html'`, `'/assets/*'`, `'/*'`). Collected from the rest arguments into an array. |

## Returns

`void` — the story resumes once the invalidation request has been accepted by the CDN. Note this returns as soon as the invalidation is *submitted*; propagation across CDN edge locations completes asynchronously.

## Notes

- The deploy grants each service role permission to create invalidations only on that service's own web-entry distributions, so this action can be called from within the same service that owns the web entry.
- CDN providers meter invalidations (CloudFront gives a monthly free allowance and charges beyond it), so prefer invalidating specific paths over `'/*'` where practical, or lean on the [cache](../../../config/webserver/cache.md) TTLs and `ignoreCache` patterns instead.

## Related

- [defineWebEntry](../../../config/webserver/web-entry.md) — declares the hosted web app whose cache this invalidates.
- [defineCache](../../../config/webserver/cache.md) — the CDN cache policy (TTLs) an invalidation forces past.
- [defineSeo](../../../config/webserver/seo.md) — server-side (edge) rendering attached to a web entry's paths.
