---
title: askAiPrompt
description: Send a prompt to a large language model and get the full text response back in one shot.
---

# askAiPrompt

Sends a prompt to a large language model and resolves with the model's complete text response. This is the buffered, non-streaming call — the story pauses until the model has finished generating, then resumes with the whole answer. If you want to consume tokens as they arrive, use [askAiPromptStream](./ask-ai-prompt-stream.md) instead.

- **Action type:** `AiActionType.Prompt`
- **On AWS:** runs through the [Vercel AI SDK](https://ai-sdk.dev) (`generateText`) against Amazon Bedrock. Any tools declared on the matching [defineAi](../../../config/core/ai.md) config are made available to the model, and the processor runs up to 20 tool-calling steps before returning.

```typescript
import { askAiPrompt, AiModel } from 'quidproquo-core';

export function* askSummarize(document: string) {
  const { text } = yield* askAiPrompt(
    AiModel.ClaudeSonnet46,
    `Summarize the following document in three sentences:\n\n${document}`,
  );

  return text;
}
```

## Signature

```typescript
function* askAiPrompt(
  model: AiModel,
  prompt: string,
  options?: AskAiPromptOptions,
): AskResponse<AiPromptActionResult>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `model` | [`AiModel`](#aimodel) | Which model to prompt. |
| `prompt` | `string` | The user prompt. Ignored if you pass `options.messages` — a multi-turn conversation takes precedence over a single prompt string. |
| `options` | [`AskAiPromptOptions`](#askaipromptoptions) | Optional system prompt, conversation history, named AI config, and reasoning settings. |

### `AskAiPromptOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `system` | `string` | – | System prompt — high-level instructions that steer the model's behaviour for the whole request. |
| `aiName` | `string` | – | Name of a [defineAi](../../../config/core/ai.md) config to bind. This is what wires up tool definitions (and their executors) for the model to call. Omit for a plain, tool-less prompt. |
| `messages` | [`AiMessage[]`](#aimessage) | – | A full conversation history. When present, this is sent instead of `prompt`, letting you carry a multi-turn dialogue (including prior assistant turns and tool results). |
| `turnContext` | [`AiMessage[]`](#aimessage) | – | Per-request messages sent after `messages` (or after `prompt`, which then becomes the first user message). They never receive a cache point and are not meant to be saved into a conversation's history, so live state such as a document's current contents belongs here rather than in `system`, where any change rewrites the whole cached conversation. |
| `reasoning` | [`AiReasoningConfig`](#aireasoningconfig) | – | Enables extended thinking. Its presence turns reasoning on. On Claude 4.6 and older, `budgetTokens` caps how many tokens the model may spend thinking (defaults to `4096` on AWS) and `effort` is ignored. Opus 4.7 and newer and Sonnet 5 run adaptive thinking: the model decides how much to think, `effort` nudges it (`AiReasoningEffort.Low` to `Max`), and `budgetTokens` is ignored. |
| `caching` | `boolean` | – | Places Bedrock cache points on the system prompt (which also covers the tool definitions) and on the last `messages` entry, and after every tool-calling step on the newest tool message, so the next call in the conversation and the next step in the loop read everything up to there from cache. `turnContext` is never marked. A point only takes effect once the prefix before it reaches the model's minimum: 512 tokens on Claude Opus 5 and 5.5, 1,024 on Sonnet 4.6, Sonnet 5 and Opus 4.8, 4,096 on Opus 4.6, Opus 4.7 and Haiku 4.5. |
| `cacheTtl` | `AiCacheTtl` | `AiCacheTtl.Dynamic` | Requested lifetime of the request's cache points. `AiCacheTtl.Dynamic` lets the provider choose per point: on Bedrock an hour for the system prompt and the last `messages` entry, so they outlive a pause between turns, and five minutes for the tool-loop point, which is discarded when the call ends. `AiCacheTtl.ProviderDefault` leaves every point on the provider's default (five minutes on Bedrock); `AiCacheTtl.FiveMinutes` keeps every point on five minutes; `AiCacheTtl.OneHour` pins the hour on the system prompt and the last `messages` entry. The tool-loop point is always five minutes, whatever is requested, because it is discarded when the call ends. A request, not a guarantee: a Bedrock model that cannot cache for an hour gets the default instead of a failed request. |
| `maxSteps` | `number` | – | Cap on model/tool steps in one call. Unset means no cap: the loop runs until the model stops on its own or `maxDurationMs` trips. A client-side tool call (a tool with no executor) still halts it immediately. |
| `maxOutputTokens` | `number` | provider default | Output token cap per model call. Bedrock defaults to 8192, which a reasoning block plus a large tool input can exceed; the step then finishes with `length` and the tool call arrives truncated. Raise it for agentic workloads (Claude Sonnet allows 64k). |
| `maxDurationMs` | `number` | – | Wall-clock budget for the tool loop. Checked between steps, so the loop can overrun by one step; leave headroom. When it trips with tool calls still outstanding the result finishes with `toolCalls`, and re-sending the recorded history resumes the turn. Pair it with [askGetRuntimeRemainingTime](../system/ask-get-runtime-remaining-time.md) to stop before the platform deadline. |

### `AiModel`

The model to run. On AWS each value maps to a Bedrock cross-region inference profile per data region. A request takes the Australian profile when the model has one, otherwise the Global one, otherwise the first the model lists. A model whose only region is Global is processed wherever Bedrock chooses, which may be outside Australia; check [askAiGetModelRegions](./ask-ai-get-model-regions.md) before offering it where data must stay onshore. [askAiGetModelRegions](./ask-ai-get-model-regions.md) returns the regions each member is offered in, for a model picker.

| Member | Model | Data regions |
| --- | --- | --- |
| `ClaudeHaiku35` | Claude 3.5 Haiku | Australia |
| `ClaudeSonnet35` | Claude 3.5 Sonnet | Australia |
| `ClaudeSonnet4` | Claude Sonnet 4 | Australia |
| `ClaudeOpus4` | Claude Opus 4 | Australia |
| `ClaudeHaiku45` | Claude Haiku 4.5 | Australia |
| `ClaudeSonnet45` | Claude Sonnet 4.5 | Australia |
| `ClaudeOpus45` | Claude Opus 4.5 | Australia |
| `ClaudeSonnet46` | Claude Sonnet 4.6 | Australia |
| `ClaudeOpus46` | Claude Opus 4.6 | Australia |
| `ClaudeOpus47` | Claude Opus 4.7 | Australia |
| `ClaudeOpus48` | Claude Opus 4.8 | Australia |
| `ClaudeSonnet5` | Claude Sonnet 5 | Australia |
| `ClaudeOpus5` | Claude Opus 5 | Australia |
| `ClaudeOpus55` | Claude Opus 5.5 | Australia |
| `ClaudeSonnet55` | Claude Sonnet 5.5 | Global |
| `ClaudeFable5` | Claude Fable 5 | Global |
| `ClaudeFable51` | Claude Fable 5.1 | Global |

Bedrock no longer lists an `au.` profile for `ClaudeHaiku35`, `ClaudeSonnet35`, `ClaudeSonnet4`, `ClaudeOpus4` or `ClaudeOpus45` (as of October 2026), so a request on one of them fails at call time with a Bedrock validation error. Sonnet 5.5, Fable 5 and Fable 5.1 have no `au.` profile, so they are Global only.

### `AiMessage`

A discriminated union on `role`. Use `messages` when you need multi-turn context instead of a single `prompt`.

```typescript
type AiMessage = AiUserMessage | AiAssistantMessage | AiToolMessage;

type AiUserMessage      = { role: 'user';      content: string | AiUserMessagePart[] };
type AiAssistantMessage = { role: 'assistant'; content: string | AiAssistantMessagePart[] };
type AiToolMessage      = { role: 'tool';      content: AiToolResultPart[] };
```

`content` can be a plain string or an array of parts. The available parts:

| Part (`type`) | Fields | Notes |
| --- | --- | --- |
| `text` | `text` | Plain text. |
| `file` (URL) | `url`, `mediaType`, `filename?` | Attach a file by URL. |
| `file` (drive) | `drive`, `filepath`, `scope?`, `mediaType`, `filename?` | Attach a file from a [storage drive](../../../config/core/storage-drive.md). The processor resolves the contents at prompt time, so no presigned URL ever lands in logs or session state. Set `scope` when the file lives under a tenant scope; it is forwarded to the file read. |
| `tool-call` | `toolCallId`, `toolName`, `input` | An assistant turn's request to call a tool. |
| `reasoning` | `text`, `providerOptions?` | An assistant turn's thinking block. |
| `tool-result` | `toolCallId`, `toolName`, `output`, `isError?` | The result you feed back for a tool call (in a `tool` message). |

### `AiReasoningConfig`

```typescript
type AiReasoningConfig = {
  budgetTokens?: number;
  effort?: AiReasoningEffort; // Low | Medium | High | XHigh | Max
};
```

Which field applies depends on the model, see `reasoning` above. A config may carry both; the model ignores the one it does not take.

## Returns

`AiPromptActionResult`: `{ text: string; usage?: AiStreamUsage }`. `text` is the model's complete response; `usage` is the token usage summed across every step when the provider reports it, with `inputTokens`, `outputTokens`, `totalTokens` and, when caching on Bedrock, `cacheReadInputTokens`, `cacheWriteInputTokens` and `noCacheInputTokens`.

## Errors

| Error | When |
| --- | --- |
| `ErrorTypeEnum.NotImplemented` | The `model` has no provider model id in any data region. |
| `ErrorTypeEnum.NotFound` | `options.aiName` names an AI config that does not exist. |
| `ErrorTypeEnum.GenericError` | Any failure while generating, with the underlying provider message. |

Catch failures with `askCatch`, which returns an `EitherActionResult` — `{ success: true, result }` or `{ success: false, error }`:

```typescript
import { askCatch, askAiPrompt, AiModel } from 'quidproquo-core';

const outcome = yield* askCatch(askAiPrompt(AiModel.ClaudeHaiku45, prompt));
if (!outcome.success) {
  // outcome.error.errorText — fall back
}
```

## Related

- [askAiPromptStream](./ask-ai-prompt-stream.md) — stream the response token-by-token instead of waiting for the whole thing.
- [askAiGetModelRegions](./ask-ai-get-model-regions.md) — where each model processes its requests, for a model picker.
- [defineAi](../../../config/core/ai.md) — declares a named AI config with tool definitions the model can call.
- [defineStorageDrive](../../../config/core/storage-drive.md) — the drive an `AiFileDrivePart` attachment reads from.
