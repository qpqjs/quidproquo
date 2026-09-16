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
| `reasoning` | [`AiReasoningConfig`](#aireasoningconfig) | – | Enables extended thinking. Its presence turns reasoning on; `budgetTokens` caps how many tokens the model may spend thinking before it answers (defaults to `4096` on AWS). |
| `caching` | `boolean` | – | Marks the system prompt and the last message (or the last `messages` entry) with a Bedrock cache point, so a following call in the same conversation can read everything up to there from cache instead of reprocessing it. |
| `maxSteps` | `number` | – | Cap on model/tool steps in one call. Unset means no cap: the loop runs until the model stops on its own or `maxDurationMs` trips. A client-side tool call (a tool with no executor) still halts it immediately. |
| `maxOutputTokens` | `number` | provider default | Output token cap per model call. Bedrock defaults to 8192, which a reasoning block plus a large tool input can exceed; the step then finishes with `length` and the tool call arrives truncated. Raise it for agentic workloads (Claude Sonnet allows 64k). |
| `maxDurationMs` | `number` | – | Wall-clock budget for the tool loop. Checked between steps, so the loop can overrun by one step; leave headroom. When it trips with tool calls still outstanding the result finishes with `toolCalls`, and re-sending the recorded history resumes the turn. Pair it with [askGetRuntimeRemainingTime](../system/ask-get-runtime-remaining-time.md) to stop before the platform deadline. |

### `AiModel`

The model to run. Values map to the underlying Bedrock model ids.

| Member | Model |
| --- | --- |
| `ClaudeHaiku35` | Claude 3.5 Haiku |
| `ClaudeSonnet35` | Claude 3.5 Sonnet |
| `ClaudeSonnet4` | Claude Sonnet 4 |
| `ClaudeOpus4` | Claude Opus 4 |
| `ClaudeHaiku45` | Claude Haiku 4.5 |
| `ClaudeSonnet45` | Claude Sonnet 4.5 |
| `ClaudeOpus45` | Claude Opus 4.5 |
| `ClaudeSonnet46` | Claude Sonnet 4.6 |
| `ClaudeOpus46` | Claude Opus 4.6 |

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
interface AiReasoningConfig {
  budgetTokens?: number;
}
```

## Returns

`AiPromptActionResult` — `{ text: string }`, the model's complete response text.

## Errors

| Error | When |
| --- | --- |
| `ErrorTypeEnum.NotImplemented` | The `model` has no mapping to an underlying provider model id. |
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
- [defineAi](../../../config/core/ai.md) — declares a named AI config with tool definitions the model can call.
- [defineStorageDrive](../../../config/core/storage-drive.md) — the drive an `AiFileDrivePart` attachment reads from.
