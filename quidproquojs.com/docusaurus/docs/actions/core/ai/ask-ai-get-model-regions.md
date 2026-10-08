---
title: askAiGetModelRegions
description: Look up where each AI model processes its requests, so a model picker can show where the data goes.
---

# askAiGetModelRegions

Resolves with the data regions every [`AiModel`](./ask-ai-prompt.md#aimodel) is offered in on the current platform. Use it to build a model picker that shows the user where a request will be processed, or to refuse a model whose region your data must not reach. The mapping belongs to the platform (on AWS, the Bedrock inference profile behind each model), so a story asks for it instead of hard-coding it.

- **Action type:** `AiActionType.GetModelRegions`
- **On AWS:** reads the regions off the Bedrock model map in the lambda action processor, which holds an inference profile id per model per region. Every current entry is an `au.` profile, so every model lists only `AiDataRegion.Australia`. A prompt takes the Australian profile when the model has one, then Global, then the first region listed, so a model that lists only Global would run through its Global profile.

```typescript
import { askAiGetModelRegions, AiDataRegion, AiModel } from 'quidproquo-core';

export function* askListAustralianModels(): AskResponse<AiModel[]> {
  const regions = yield* askAiGetModelRegions();

  return (Object.keys(regions) as AiModel[]).filter((model) => regions[model].includes(AiDataRegion.Australia));
}
```

## Signature

```typescript
function* askAiGetModelRegions(): AskResponse<AiModelRegionMap>;
```

Takes no parameters.

## Returns

`AiModelRegionMap`, a `Record<AiModel, AiDataRegion[]>` with an entry for every enum member. A model may be offered in several regions.

### `AiDataRegion`

| Member | Meaning |
| --- | --- |
| `Australia` | Requests are processed in Australia (on AWS, an `au.` inference profile). |
| `Global` | Requests may be processed anywhere the provider chooses (on AWS, a `global.` inference profile). No model lists it today; the member exists so adding one is a visible choice. |

## Errors

| Error | When |
| --- | --- |
| `ErrorTypeEnum.NotImplemented` | The runtime has no AI action processor (the dev server, for one). |

## Related

- [askAiPrompt](./ask-ai-prompt.md) — the `AiModel` table and what each model runs on.
