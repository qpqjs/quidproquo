---
title: askPlatformGetName
description: The name of the runtime executing the story, as its action processors declare it.
---

# askPlatformGetName

Returns the name of the platform the story is running on, an opaque string each runtime's action processor set registers for itself: `aws` on Lambda, `devServer` on the dev server, `browser` in the browser, `node` on a plain node runtime.

It exists for the rare story that must skip or degrade work a platform cannot do (a smoke test with no local equivalent, say). It is not for ordinary logic: a story that branches on the platform is doing what action processors are for.

```typescript
import { askPlatformGetName } from 'quidproquo-core';

export function* askRunDeployedOnlyCheck() {
  const platform = yield* askPlatformGetName();
  if (platform === 'devServer') {
    return;
  }
  // ...
}
```

## Signature

```typescript
function* askPlatformGetName(): AskResponse<string>;
```

## Returns

`string` — the registered platform name. Core defines no names; each runtime registers its own literal.
