---
title: defineSeo
description: Attach a server-side (edge) rendered response to a web entry path, so crawlers and social previews get real HTML instead of the SPA shell.
---

# defineSeo

Defines an **SEO route**: a URL path within a [web entry](./web-entry.md) whose response is generated server-side at the CDN edge by a story, instead of being served as the static single-page-app shell. This lets crawlers, bots, and social-preview scrapers receive fully rendered HTML (title, meta tags, Open Graph, etc.) for a path, while normal users still get the SPA.

- **On AWS:** the web entry's CloudFront distribution gets two Lambda@Edge functions — a **viewer-request** and an **origin-request** function — built from the `runtime` story. For each non-deprecated SEO route, a CloudFront behavior is added whose path pattern is the SEO `path` with any `{param}` placeholders turned into `*` wildcards, wiring both edge functions to that behavior. The behavior forwards the viewer's query string to the origin-request function, and the story receives it parsed as `SeoEvent.query` (a single value as a string, repeated keys as an array). The route can use its own [cache](./cache.md) policy via `cacheSettingsName` (otherwise caching is disabled for it). Deprecated routes are still built but are **not** attached as a behavior.

```typescript
import { defineSeo } from 'quidproquo-webserver';

export default [
  defineSeo('/products/{productId}', '/entry/seo/product::renderProductSeo'),
];
```

## Signature

```typescript
function defineSeo(
  path: string,
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedSeoSettings,
): SeoQPQWebServerConfigSetting;
```

## Parameters

### `path` — `string` (required)

The URL path pattern to render server-side, e.g. `'/products/{productId}'`. `{param}` placeholders are matched as wildcards in the CDN behavior. The `uniqueKey` of the setting is a hash of this path.

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the story that renders the response at the edge, usually written as a relative path string in the form `'/path/to/file::exportedFunctionName'` (the same `QpqFunctionRuntime` shape used across the framework — a relative-path string or an advanced `{ basePath, relativePath, functionName }` object).

### `options` — `QPQConfigAdvancedSeoSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `webEntry` | `string` | all web entries | Name of the [web entry](./web-entry.md) this SEO route belongs to. When set, the route is only attached to that web entry's distribution; when omitted, it applies to every web entry in the service. |
| `cacheSettingsName` | `string` | caching disabled | Name of a [defineCache](./cache.md) policy for this route's CDN behavior. When omitted, the edge-rendered response is not cached. |
| `deprecated` | `boolean` | `false` | When `true`, the edge function is still built but no CDN behavior is added — the path falls back to the normal SPA serving. |

## Examples

```typescript
import { defineSeo, defineWebEntry } from 'quidproquo-webserver';

export default [
  defineWebEntry('website', {
    buildPath: './web/dist',
    domain: { onRootDomain: true },
  }),

  // Render product pages server-side for crawlers & link previews
  defineSeo('/products/{productId}', '/entry/seo/product::renderProductSeo', {
    webEntry: 'website',
    cacheSettingsName: 'default',
  }),
];
```

## Related

- [defineWebEntry](./web-entry.md) — the hosted app whose paths this SEO route augments.
- [defineCache](./cache.md) — the cache policy an SEO route can reference by name.
- [askWebEntryInvalidateCache](../../actions/webserver/web-entry/ask-web-entry-invalidate-cache.md) — invalidate SEO paths after changing what they render.
- **AWS implementation:** the SEO Lambda@Edge functions and CloudFront behaviors are created by `WebQpqWebserverWebEntryConstruct` in `quidproquo-deploy-awscdk`.
