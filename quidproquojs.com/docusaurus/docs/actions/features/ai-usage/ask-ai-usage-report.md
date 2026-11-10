---
title: askAiUsageReport
description: Count one model call in a report, with its tokens, what it cost the platform and what the client is charged for it.
---

# askAiUsageReport

Counts one model call in a [report](../../../config/features/reports.md): the tokens it used, what it cost at the platform's list price, and what the client is charged for it at your own rates. Call it after an [askAiPrompt](../../core/ai/ask-ai-prompt.md) or an [askAiPromptStream](../../core/ai/ask-ai-prompt-stream.md) finishes. The eventDoc AI chat calls it for you when its config has a [`usageReport`](../../../config/features/event-doc-ai.md).

The count is filed under the caller's storage scope, so on a scoped report a call made for a tenant's document is that tenant's, and one made in someone's personal space is theirs.

```typescript
import { AiModel, askAiPrompt } from '@qpqjs/core';
import { askAiUsageReport } from '@qpqjs/features';

const CHARGE_RATES = {
  [AiModel.ClaudeSonnet46]: { input: 6, output: 30, cacheRead: 0.6, cacheWriteFiveMinutes: 7.5, cacheWriteOneHour: 12 },
};

// For any model missing from CHARGE_RATES: at or above the dearest rate you charge.
const DEFAULT_CHARGE_RATES = { input: 20, output: 100, cacheRead: 2, cacheWriteFiveMinutes: 25, cacheWriteOneHour: 40 };

export function* askTemplateSummarise(text: string) {
  const reply = yield* askAiPrompt(AiModel.ClaudeSonnet46, `Summarise:\n${text}`);

  if (reply.usage) {
    yield* askAiUsageReport('docgen', {
      model: AiModel.ClaudeSonnet46,
      source: 'summary',
      usage: reply.usage,
      chargeRates: CHARGE_RATES,
      defaultChargeRates: DEFAULT_CHARGE_RATES,
    });
  }

  return reply.text;
}
```

## Signature

```typescript
function* askAiUsageReport(reportName: string, input: AiUsageReportInput): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `reportName` | `string` | The report, as declared with [defineReports](../../../config/features/reports.md). |
| `input` | `AiUsageReportInput` | The call to count. |

### `AiUsageReportInput`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `model` | `AiModel` | yes | The model the call ran on. Counted as the `model` dimension, and the key into `chargeRates`. |
| `source` | `string` | yes | What asked for the call, such as a chat type. Counted as the `source` dimension, so it is a category, never an identifier. |
| `usage` | `AiStreamUsage` | yes | The call's usage, as the AI action returned it. |
| `chargeRates` | `AiModelTokenRates` | yes | What you charge per token, per model, in US dollars per million tokens: `{ input, output, cacheRead, cacheWriteFiveMinutes, cacheWriteOneHour? }`, the same shape as the platform's price list. |
| `defaultChargeRates` | `AiTokenRates` | yes | What a model missing from `chargeRates` is charged at, so forgetting a model never makes it free. Set it at or above the dearest rate you charge. |
| `cacheTtl` | `AiCacheTtl` | no | The cache lifetime the call asked for. Cache writes are charged at `cacheWriteFiveMinutes` only for `AiCacheTtl.FiveMinutes`, and at `cacheWriteOneHour` otherwise (the five minute rate when there is no hour rate). |

## The event

One `aiUsage` event (`AI_USAGE_REPORT_EVENT`) per call:

| | Name | Description |
| --- | --- | --- |
| dimension | `model` | The model. |
| dimension | `source` | What asked for the call. |
| measure | `inputTokens` | All input: uncached, read from the cache and written to it. |
| measure | `noCacheInputTokens`, `cacheReadInputTokens`, `cacheWriteInputTokens` | The three kinds of input. |
| measure | `outputTokens` | Output, reasoning included. |
| measure | `costMicroUsd` | What the call cost at the platform's list price, in millionths of a US dollar. Present when the platform prices its calls (Bedrock does). |
| measure | `chargeMicroUsd` | What the client is charged at the model's `chargeRates` (or `defaultChargeRates`), in millionths of a US dollar, worked out with `getAiUsageAmountMicroUsd`, the same function the platform prices the cost with. Always present. |

A usage field the provider did not report is left out, never counted as 0. A view over the event adds up `costMicroUsd` and `chargeMicroUsd` like any other measure, so cost, charge and margin come from the same counts.

## Returns

`AskResponse<void>`, once the event is published. It is counted later, on the report's owner.

## Errors

None. A count must never break the AI reply it counts:

- a model with no entry in `chargeRates` is charged at `defaultChargeRates`, and a warning naming the model is logged so the missing rate can be added;
- an event the report refuses, or a failed send to the report's bus, is logged at error and the story carries on.

## Notes

- The charge is worked out when the call is made, so raising your rates only changes calls from then on, and what earlier months were charged stays as it was.
- Amounts are whole millionths of a dollar so they add up exactly. Divide by 1,000,000 for dollars.

## Related

- [defineEventDocAi](../../../config/features/event-doc-ai.md): `usageReport` counts every chat model call with this.
- [askReportAppend](../reports/ask-report-append.md): what this appends with, and its limits.
- [askReportRead](../reports/ask-report-read.md): reads views of the counts.
