---
title: askAiPromptStream
description: Send a prompt to a large language model and receive the response incrementally as a stream of typed events.
---

# askAiPromptStream

Sends a prompt to a large language model and resolves immediately with a **stream handle** rather than a finished string. The story then reads events off the stream as the model produces them — text deltas, reasoning, tool calls, usage, and lifecycle markers. Use this when you want to forward tokens to a client in real time (e.g. over a WebSocket) or react to tool calls as they happen. For a simple one-shot answer, use [askAiPrompt](./ask-ai-prompt.md) instead.

- **Action type:** `AiActionType.PromptStream`
- **On AWS:** runs through the [Vercel AI SDK](https://ai-sdk.dev) (`streamText`) against Amazon Bedrock, registering the SDK's event stream in the runtime's stream registry and handing back a handle to it.

```typescript
import { askAiPromptStream, askStreamProcess, AiModel, AiStreamPartType } from 'quidproquo-core';

export function* askAnswerStreamed(prompt: string) {
  const stream = yield* askAiPromptStream(AiModel.ClaudeSonnet46, prompt);

  yield* askStreamProcess(stream, function* (part) {
    if (part.type === AiStreamPartType.TextDelta) {
      // forward part.text to the client...
    }
  });
}
```

## Signature

```typescript
function* askAiPromptStream(
  model: AiModel,
  prompt: string,
  options?: AskAiPromptStreamOptions,
): AskResponse<StreamHandle<'json', AiStreamPart>>;
```

## Parameters

The parameters are identical to [askAiPrompt](./ask-ai-prompt.md) — see there for [`AiModel`](./ask-ai-prompt.md#aimodel), [`AiMessage`](./ask-ai-prompt.md#aimessage), and [`AiReasoningConfig`](./ask-ai-prompt.md#aireasoningconfig).

| Parameter | Type | Description |
| --- | --- | --- |
| `model` | `AiModel` | Which model to prompt. |
| `prompt` | `string` | The user prompt. Ignored when `options.messages` is set. |
| `options` | `AskAiPromptStreamOptions` | `{ system?, aiName?, messages?, reasoning?, caching?, maxDurationMs?, maxSteps?, maxOutputTokens? }` — same shape and meaning as [`AskAiPromptOptions`](./ask-ai-prompt.md#askaipromptoptions). |

## Returns

`StreamHandle<'json', AiStreamPart>` — a handle to a JSON-encoded stream whose items are [`AiStreamPart`](#the-stream-aistreampart) events. Read it with the [stream stories](../../../actions/core/stream/ask-stream-read.md): `askStreamProcess` (run a callback per part), `askStreamMap` (collect/transform into an array), or the lower-level `askStreamRead` / `askStreamClose`.

## The stream: `AiStreamPart`

`AiStreamPart` is a discriminated union; narrow on `type` (an `AiStreamPartType` value) to read the per-variant fields. The broad lifecycle is:

```
Start → (StartStep → step events → FinishStep)+ → Finish
```

Within a step, text / reasoning / tool-input events arrive as matched `*Start → *Delta… → *End` triples sharing an `id`.

### `AiStreamPartType`

| Member (`type`) | When it fires |
| --- | --- |
| `Start` (`start`) | Once, before anything else — the response is starting. |
| `Finish` (`finish`) | Once, at the very end — includes aggregate usage. |
| `StartStep` (`start-step`) | A generation step (one round-trip to the model) started. |
| `FinishStep` (`finish-step`) | The current step ended, with its finish reason and usage. |
| `TextStart` / `TextDelta` / `TextEnd` | Beginning / incremental chunk / end of a text block. |
| `ReasoningStart` / `ReasoningDelta` / `ReasoningEnd` | Beginning / chunk / end of an extended-thinking block. |
| `ToolInputStart` / `ToolInputDelta` / `ToolInputEnd` | The model is streaming a tool call's (JSON) arguments. |
| `ToolCall` (`tool-call`) | A fully-assembled, parsed tool call. |
| `ToolResult` (`tool-result`) | A tool finished successfully — carries `input` and `output`. |
| `ToolError` (`tool-error`) | A tool threw; `message` holds the stringified error. |
| `ToolApprovalRequest` (`tool-approval-request`) | The model wants permission to run a tool — awaiting approve/deny. |
| `ToolApprovalResponse` (`tool-approval-response`) | The approve/deny decision for a prior request. |
| `ToolOutputDenied` (`tool-output-denied`) | The caller denied a tool after an approval request. |
| `Source` (`source`) | The model cited a source (URL/document) — for grounded / RAG responses. |
| `File` (`file`) | The model produced a file artifact (e.g. a generated image). |
| `ReasoningFile` (`reasoning-file`) | A reasoning file artifact (e.g. an encrypted reasoning trace). |
| `Abort` (`abort`) | The stream was aborted (abort signal, client disconnect). |
| `Error` (`error`) | A non-fatal streaming error surfaced to the consumer. |
| `Raw` (`raw`) | A provider-specific raw chunk, passed through for debugging. |
| `Custom` (`custom`) | A provider-specific custom event identified by `kind`. |

### `AiStreamFinishReasonEnum`

`Finish.finishReason` and `FinishStep.finishReason` are an `AiStreamFinishReasonEnum` value, not a raw string.

| Member | Wire value | Meaning |
| --- | --- | --- |
| `stop` | `stop` | The model completed its answer naturally. |
| `length` | `length` | The response hit the output token limit. |
| `contentFilter` | `content-filter` | The provider's content filter stopped the response. |
| `toolCalls` | `tool-calls` | Generation stopped while the model still had tool calls in flight. On the final `Finish` part this means the turn was halted early by a stop condition (`maxSteps` or `maxDurationMs`) rather than finishing naturally, and can be resumed by re-sending the recorded history. |
| `error` | `error` | The stream errored. |
| `other` | `other` | The provider reported a reason outside this catalog. |
| `unknown` | `unknown` | The provider reported no reason, or one this version does not recognise. |

## Errors

| Error | When |
| --- | --- |
| `ErrorTypeEnum.NotImplemented` | The `model` has no mapping to an underlying provider model id. |
| `ErrorTypeEnum.NotFound` | `options.aiName` names an AI config that does not exist. |
| `ErrorTypeEnum.GenericError` | Any failure while setting up the stream. |

Non-fatal issues that arise mid-stream surface as `Error` (`error`) parts rather than throwing. Wrap the initial call with `askCatch` if the model may be unavailable.

## Related

- [askAiPrompt](./ask-ai-prompt.md) — the buffered, one-shot counterpart.
- [defineAi](../../../config/core/ai.md) — declares tools the model can call.
- [askStreamRead](../../../actions/core/stream/ask-stream-read.md) / [askStreamClose](../../../actions/core/stream/ask-stream-close.md) — the low-level stream actions.
- [askStreamProcess](../../../actions/core/stream/ask-stream-process.md) / [askStreamMap](../../../actions/core/stream/ask-stream-map.md) — consume the returned handle in one call (run a callback per part, or collect the parts into an array).
- [askEventDocAiProcessSend](../../features/event-doc-ai/ask-event-doc-ai-process-send.md) — the eventDocAi chat turn that drives this stream to the browser.
