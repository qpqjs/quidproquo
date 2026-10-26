---
title: defineUserScriptModule
description: Let user scripts on a service import a module the service provides, such as an SDK of the service's own actions.
---

# defineUserScriptModule

Lets user scripts built and run on this service import a module the service provides. The module is an **exported object**, the same shape [defineDynamicFunctions](./dynamic-functions.md) registers: typically an SDK of action requesters the service handles with its own [action processors](./action-processors.md), plus types and helpers. A script imports it by name:

```typescript
// in a user script
import { askNewGuid } from 'my-app-sdk/v1';
```

- **On AWS:** deploys **no dedicated infrastructure**. The module is bundled with the service like any other runtime and loaded only when a script is built or run.
- **Build:** [askUserScriptBuild](../../actions/core/user-script/ask-user-script-build.md) and [askUserScriptBuildFromZip](../../actions/core/user-script/ask-user-script-build-from-zip.md) keep the import external (it is never bundled into the script), and check the built file loads against the service's instance. An undeclared import of the same name fails the build.
- **Run:** [askUserScriptExecute](../../actions/core/user-script/ask-user-script-execute.md) hands the script the service's own instance when it requires the name.

```typescript
import { defineUserScriptModule } from 'quidproquo-core';

export default [
  defineUserScriptModule('my-app-sdk/v1', '/entry/scriptModules::mySdkV1'),
];
```

## Signature

```typescript
function defineUserScriptModule(
  moduleName: string,
  runtime: QpqFunctionRuntime,
  options?: UserScriptModuleOptions,
): UserScriptModuleQPQConfigSetting;
```

## Parameters

### `moduleName` — `string` (required)

The exact import name scripts use. Putting a version in it (`my-app-sdk/v1`) lets a later `v2` change the surface while scripts built against `v1` keep working. It may not be a shared framework package (`quidproquo-core`, `quidproquo-webserver`), a relative or absolute path, or a `node:` specifier.

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the exported object, usually `'/path/to/file::exportedObjectName'`. Its properties are what the script's import sees.

### `options.types` — `` `/${string}` `` (optional)

The module's TypeScript entry, as a path from the config root (the same base a runtime's path uses), e.g. `'/../../sdk/src/v1/index.ts'`. The bundler turns it into one self-contained declaration file: the entry's exports, with the types they use from `quidproquo`, `quidproquo-core` and `quidproquo-webserver` inlined, and nothing else exported. [askUserScriptModuleTypes](../../actions/core/user-script/ask-user-script-module-types.md) returns it, so a browser script editor can autocomplete and type check the import with no build step of its own.

- It is generated wherever the backend is bundled: the deployed lambda ships it, and the dev server's watch build regenerates it when a file in the entry's folder changes.
- The entry is checked with the nearest `tsconfig.json`. If it does not type check, the build fails naming the entry.
- Types from other packages are not inlined; an editor sees them as unresolved.

## Notes

- The module is loaded at run time, not baked into the script, so a script always gets the service's current copy of that name. Keep a published name backward compatible, and add a new versioned name for breaking changes.
- A declared module that fails to load throws out of the build or execute processor rather than being reported as the script's error.
- This controls what a script can **import**, not what it can **do**: a script can still yield any action object by hand. Treat it as an API surface, not a security boundary.
