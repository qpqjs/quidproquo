---
title: askExecuteStory
description: Load and run another story by its function runtime reference.
---

# askExecuteStory

Runs a **separate story**, referenced by its function runtime (the `'/path/to/file::exportedFunctionName'` handle), and returns whatever that story returns. The target is dynamically loaded and executed in-process, receiving the parameters you pass.

- **Action type:** `SystemActionType.ExecuteStory`

```typescript
import { askExecuteStory } from '@qpqjs/core';

export function* askProcessUpload(fileId: string) {
  // Run the resize story, whose entry point lives in another module.
  const thumbnail = yield* askExecuteStory<[string], string>(
    '/entry/image/resize::resizeImage',
    [fileId],
  );

  return thumbnail;
}
```

## Signature

```typescript
function* askExecuteStory<StoryInput extends Array<any>, StoryOutput>(
  runtime: QpqFunctionRuntime,
  params: StoryInput,
  storySession?: StorySession,
): AskResponse<StoryOutput>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `runtime` | `QpqFunctionRuntime` | Reference to the story entry point to run — either a relative-path string of the form `'/path/to/file::exportedFunctionName'`, or the advanced `{ basePath, relativePath, functionName }` object form. |
| `params` | `StoryInput` | Positional arguments passed to the target story, as a tuple/array matching its parameters. |
| `storySession` | `StorySession` | Optional session to run the story under. When omitted, the story runs with a session derived from the current one. |

## Returns

`StoryOutput` — the value the executed story returns. Provide the generics (`askExecuteStory<[Args], Result>`) to type both the parameters and the return.

## Notes

- The target story is resolved through the runtime's dynamic module loader. If it cannot be loaded, the action fails with `ErrorTypeEnum.NotFound`; any error thrown while the story runs surfaces as `ErrorTypeEnum.GenericError`. Wrap the call in [askCatch](./ask-catch.md) if you want to handle those as values.
- The executed story runs its own actions through the same processors, so it behaves like any other story — it just starts from a runtime reference rather than being imported and called directly.

## Related

- [askGetRuntimeCorrelation](./ask-get-runtime-correlation.md) — the correlation id that links a story and the sub-stories it triggers.
- [askRunParallel](./ask-run-parallel.md) — run multiple stories concurrently when you already have their generators in hand.
