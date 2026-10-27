---
title: defineBackendBundleOptions / defineFrontendBundleOptions
description: "Tune how the service's backend and frontend bundles are built: externals, ignored modules, suppressed warnings, and shared frontend singletons."
---

# defineBackendBundleOptions / defineFrontendBundleOptions

Declares **bundler options** for the service. These settings deploy nothing themselves: they are read by the build layer (`@qpqjs/deploy-rspack`) when it bundles the service's backend code and frontend views. You can declare either setting more than once; the build layer merges every declared block (later lists concatenate onto earlier ones).

All regex-shaped fields are plain regex **source strings**, not `RegExp` objects, because a QPQ config must survive JSON serialization. The bundler compiles them with `new RegExp(...)`.

```typescript
import { defineBackendBundleOptions, defineFrontendBundleOptions } from '@qpqjs/core';

export default [
  defineBackendBundleOptions({
    externals: ['sharp'],
  }),

  defineFrontendBundleOptions({
    sharedSingletons: ['chakra', 'zod'],
  }),
];
```

## defineBackendBundleOptions

### Signature

```typescript
function defineBackendBundleOptions(
  options: BackendBundleOptions,
): BackendBundleOptionsQPQConfigSetting;
```

### Options: `BackendBundleOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `externals` | `string[]` | `[]` | Packages to `require()` at runtime instead of bundling. Prefer declaring layer-provided packages on the layer itself (`ApiLayer.modules`); this is the escape hatch for non-layer cases. |
| `ignoreModules` | [`BundleIgnoreModule[]`](#bundleignoremodule) | `[]` | Optional requires inside dependencies that should resolve to nothing (the bundler drops them). |
| `ignoreWarnings` | [`BundleIgnoreWarning[]`](#bundleignorewarning) | `[]` | Known-noisy build warnings to suppress. |

### `BundleIgnoreModule`

| Property | Type | Description |
| --- | --- | --- |
| `resource` | `string` | Regex source for the request to drop from the bundle, e.g. `'^original-fs$'`. |
| `context` | `string` (optional) | Only drop when required from a module matching this regex source, e.g. `'adm-zip'`. |

### `BundleIgnoreWarning`

| Property | Type | Description |
| --- | --- | --- |
| `module` | `string` (optional) | Regex source matched against the module emitting the warning. |
| `message` | `string` (optional) | Regex source matched against the warning message. |

## defineFrontendBundleOptions

### Signature

```typescript
function defineFrontendBundleOptions(
  options: FrontendBundleOptions,
): FrontendBundleOptionsQPQConfigSetting;
```

### Options: `FrontendBundleOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `sharedSingletons` | `string[]` | `[]` | Substring-matched against the hoisted root dependency names; matches are shared as module-federation **singletons** in the views build. `react`, `react-dom`, react-ish deps, and `@qpqjs/web*` are always singletons; this adds app-stack packages (e.g. `'chakra'`, `'zod'`) without baking package names into the bundler. |

## Notes

- Multiple declarations merge: `qpqCoreUtils.getBackendBundleOptions` / `getFrontendBundleOptions` concatenate the lists from every declared setting, so a shared config block and a service-specific block can each contribute options.
- Backend externals combine with the modules declared on the service's Lambda layers; the layer is the preferred home for anything a layer actually provides.

## Examples

```typescript
import { defineBackendBundleOptions } from '@qpqjs/core';

export default [
  defineBackendBundleOptions({
    // Native module provided outside the bundle
    externals: ['sharp'],

    // adm-zip optionally requires original-fs (an Electron shim) - drop it
    ignoreModules: [{ resource: '^original-fs$', context: 'adm-zip' }],

    // liquidjs emits a known-noisy parse warning
    ignoreWarnings: [{ module: 'liquidjs', message: 'module\\.createRequire failed parsing argument' }],
  }),
];
```

## Related

- [defineFederatedModuleStore](./federated-module-store.md): load story code from a store at runtime instead of only the bundled zip.
- [defineApiBuildPath](./api-build-path.md): where the bundled backend output lives.
- **Build implementation:** `getRspackConfigForQpq` and `getQpqBundleExternals` in `@qpqjs/deploy-rspack`.
