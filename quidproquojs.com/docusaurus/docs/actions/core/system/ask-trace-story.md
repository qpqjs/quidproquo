---
title: askTraceStory
description: Replay a recorded story against its real code and capture a line-by-line execution trace.
---

# askTraceStory

Replays a previously recorded story execution (a `StoryResult` from the logs) against the story's real code and records a **line-by-line execution trace**: every statement the story executed, with the values of its local variables at that moment.

- **Action type:** `SystemActionType.TraceStory`
- **Runtime support:** only node runtimes (AWS Lambda and the dev server) implement a processor. The tracer drives the V8 inspector, so browser runtimes cannot process this action.

The recorded `StoryResult` already contains every action result the original run saw, so the replay is deterministic: the story re-executes with the exact same inputs and answers, and the tracer captures what happened between the actions. The story's code is loaded through the runtime's dynamic module loader (which federates on Lambda), so the trace runs the same code that ran originally.

```typescript
import { askTraceStory } from '@qpqjs/core';

export function* askDebugExecution(storyResult: StoryResult<any>) {
  const trace = yield* askTraceStory(storyResult);

  // trace.steps: one entry per executed statement, with locals captured at that point.
  return trace;
}
```

## Signature

```typescript
function* askTraceStory(
  storyResult: StoryResult<any>,
  scriptPatterns?: string[],
  onlyOwnCode?: boolean,
): AskResponse<QpqExecutionTrace>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `storyResult` | `StoryResult<any>` | The recorded execution to replay. Must carry `qpqFunctionRuntimeInfo` so the processor can locate the story's code. |
| `scriptPatterns` | `string[]` | Optional regex sources matched against script urls, tracing extra scripts in addition to the story function's own script (for bundles split across chunks). |
| `onlyOwnCode` | `boolean` | Optional. When true, breakpoints are only set on statements whose source-mapped origin is the service's own code; positions mapping into node_modules (framework and dependencies) are skipped, so the step budget is spent entirely on user statements. |

## Returns

`QpqExecutionTrace`: the trace of the replay.

- `sources`: the original source files the trace maps into (with content when source maps shipped `sourcesContent`).
- `steps`: one entry per executed statement (source position, function name, captured locals, and the return value at function-return points).
- `truncated`: true when the step budget was hit; the replay still ran to completion but later steps were not recorded.
- `stats`: pause/breakpoint counts and timing, including the urls of every instrumented script.

## Errors

| Error type | When |
| --- | --- |
| `ErrorTypeEnum.BadRequest` | The `storyResult` has no `qpqFunctionRuntimeInfo`, so the processor cannot locate its code. |
| `ErrorTypeEnum.NotFound` | The story's module could not be dynamically loaded. |
| `ErrorTypeEnum.GenericError` | The tracer itself failed while replaying the story. |

Wrap the call in [askCatch](./ask-catch.md) to handle these as values.

## Related

- [askGetRuntimeCorrelation](./ask-get-runtime-correlation.md): the correlation id that identifies the recorded execution to trace.
- [askExecuteStory](./ask-execute-story.md): run a story fresh from its runtime reference (rather than replaying a recorded run).
