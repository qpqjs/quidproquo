# AI usage report: what AI calls cost us and what we charge for them

**Verdict:** feature
**Status:** slice 1 (framework) built 10 Nov 2026, uncommitted; slice 2 (DocGen) not started
**Branch:** `reports` (builds on the reports feature). Planned with Joe on 10 Nov 2026. First consumer is DocGen's four AI chats.

## Summary

DocGen clients will see what their AI use is charged at on the dashboard, and we need to know what it costs us, so we know the margin. Every AI call already reports its tokens, and the reports feature already files every count under the tenant or person that made it. What's missing is a price on each call and the piece that turns each model call into a report event.

Each AI call ends up with two amounts in US dollars beside its tokens:

- **Cost**: what the platform charges us. The Bedrock action processor works it out from Bedrock's price list and adds it to the usage it already returns, so every AI call carries it, not only the chats.
- **Charge**: what we bill the client, from our own per-token rates, which the app passes in. Worked out at the moment of the call, so raising the rates never reprices what was already used.

A small `aiUsage` module in `@qpqjs/features` records one report event per model call with the tokens, the cost and the charge. The eventDoc AI chat feature calls it after every model call when the chat's config names a report, so DocGen's chats count without DocGen writing anything per chat.

## Decisions (Joe, 10 Nov 2026)

1. **Clients see it.** The charge goes on the client dashboard, like documents generated, and on each chat reply's saved usage (`chargeMicroUsd`), so a chat can show it. The cost never reaches a client or their browser: it is only in the report.
2. **Source is the chat type** (template, test center, transformer, content), so we can see what people use most.
3. **Cache writes are priced at the dearest rate** (the one-hour cache write) whenever the lifetime isn't known. Bedrock reports cache writes as one number.
4. **Everything in US dollars for now**: Bedrock's prices, our cost and our charge, so the margin is a subtraction.
5. **Per tenant, else personal.** AI used on a tenant's document is the tenant's; anything else is the person's. The storage scope already does this.
6. **The report is named on each chat's config** (`usageReport` on `defineEventDocAi`), and `askAiUsageReport` takes the report name, as `askReportAppend` does. No app-wide setting, so a chat that doesn't count is visible in its own config instead of quietly missing a global.
7. **Prices live in the AI layer.** The Bedrock action processor knows the model and region each call ran on, so it holds Bedrock's price list and prices each call. Apps keep no copy of Bedrock's prices.
8. **Our rates are the app's.** DocGen keeps its own per-token rates and passes them in; they change with a deploy and apply to calls from then on.
9. **One rates type and one pricing function for both.** Our rates have the same shape as Bedrock's price table (per model: input, output, cache read, and both cache write prices), and the same function prices a call against either. Bedrock's table is also keyed by region, because its price depends on where the model runs; ours is per model only.
10. **One set of our rates for every deployed tenant** for now.
11. **No totals across tenants.** AWS already shows what Bedrock costs us overall; this is for billing each tenant. So there's no unscoped copy of the events and no admin screen for margin. The cost is still kept on each event, so a tenant's bill can be set against what that tenant cost us.
12. **A required default rate on our side.** A model missing from our rates is charged at `defaultChargeRates`, with a warning, so forgetting a model never makes it free to the client. Bedrock's table needs no default: it must have an entry for every model, and a test fails if a model Bedrock can run has no price.

## Background

### What exists

- **Every AI call reports its tokens.** `AiStreamUsage` (`packages/core/src/actions/ai/types/AiStreamUsage.ts`) has `inputTokens`, `outputTokens`, `totalTokens`, `cacheReadInputTokens`, `cacheWriteInputTokens` and `noCacheInputTokens`, each optional. `askAiPrompt` returns it summed over every step as `usage`; `askAiPromptStream` sends it on its final `Finish` part, and each step's on a `FinishStep` part. `sumAiStreamUsage` adds usages up field by field. The Bedrock processor builds it in `toAiStreamUsage`.
- **The chat feature already reads it.** `askEventDocAiReplySave` takes the usage from the `Finish` part and saves it on the assistant message, which is what the chat bubbles show. With `sendUsageToFrontend` off, `redactAiStreamPartUsage` and `redactEventDocAiChatMessageUsage` strip it from what the browser gets. A turn that runs out of Lambda time hands over to another execution, and each execution is its own model call with its own usage.
- **The scope comes for free.** `askReportAppend` reads the current storage scope (`askStorageScopeRead`) and files the event under it, and DocGen's report is `scoped: true`. The chats run inside the scope of the document they're about (they read attachments through the same `askEventDocResolveScope`).
- **Each model runs in one place today.** `aiModelMap` in `actionprocessor-aws` gives every model exactly one inference profile: the Australian one for most, the global one for Sonnet 5.5 and the Fable models. The price table follows the same map, so a model offered in two regions later is priced by the one it ran on.

### Can we get the real cost from Bedrock?

Not per call. A Bedrock response carries token counts and timings, never a price. The real cost only exists in AWS billing (Cost Explorer and the cost and usage report), and splitting it by tenant there means an application inference profile per tenant per model with a tenant tag, every call made through it, the tag switched on as a cost allocation tag, and reading Cost Explorer, which is daily, around a day behind and charged per request. That can't cover personal spaces or the chat type. So the cost is Bedrock's list price times the tokens. Checking it against the real bill once a month is a later, internal step (out of scope).

### Why the charge is stored, not worked out when the dashboard reads it

- **Raising the rates must not reprice the past.** Worked out on read, new rates would change what last month cost the client. Stored, a new rate applies from the deploy that brings it in.
- **A view groups by one dimension.** Charge per chat type needs each chat type's tokens at its own model's rate. A charge measure added up by `groupBy: 'source'` just works; tokens alone would need a view per model.
- **Margin falls out of any view.** Each view's cells carry the sum of both amounts, so cost, charge and margin come from the same counts, per chat type, per tenant, per month.

The tokens stay on every event, so both amounts can always be checked.

## Approach

### Prices and amounts (core)

- `AiTokenRates`: US dollars per million tokens for `input`, `output`, `cacheRead`, `cacheWriteFiveMinutes` and `cacheWriteOneHour`. `AiModelTokenRates` is `Partial<Record<AiModel, AiTokenRates>>`, the shape of our rates.
- `getAiUsageAmountMicroUsd(usage, rates, cacheTtl)`, pure: `noCacheInputTokens x input + cacheReadInputTokens x cacheRead + cacheWriteInputTokens x (the write price) + outputTokens x output`, in millionths of a dollar, rounded to a whole number so sums stay exact. The write price is the five minute one only when the call asked for `FiveMinutes`; anything else (`OneHour`, `Dynamic`, `ProviderDefault`, unset) uses the one hour price, the dearer one. `inputTokens` is the total of the three input kinds, so it is never priced on top of them (to confirm against a real Bedrock response while building). The one function for the cost and for the charge.
- `AiStreamUsage` gains `costMicroUsd`: what the platform charges for the call at its list price. `sumAiStreamUsage` adds it like the token counts. Additive.

### Cost (Bedrock action processor)

- `bedrockModelPriceMap` beside `aiModelMap`, the same keys (model, then region) with an `AiTokenRates` in each, typed so a model can't be added without its price, and the date the prices were read from the Bedrock pricing page.
- `toAiStreamUsage` takes the resolved model's rates and the requested cache lifetime and fills in `costMicroUsd` with `getAiUsageAmountMicroUsd`, on the final usage and on each step's.
- A price change is a framework release. Each call's cost is fixed when it's made, so old counts keep the price of their time.

### Recording (features)

```ts
// On each chat (DocGen passes one constant to all four).
defineEventDocAi({ ..., usageReport: { reportName: DOCGEN_REPORT_NAME, chargeRates: DOCGEN_AI_CHARGE_RATES, defaultChargeRates: DOCGEN_AI_DEFAULT_CHARGE_RATES } });

// Any other AI caller, after a model call.
yield* askAiUsageReport(DOCGEN_REPORT_NAME, { model, source, usage, chargeRates, defaultChargeRates, cacheTtl });
```

- `askAiUsageReport(reportName, { model, source, usage, chargeRates, cacheTtl })` appends one `aiUsage` event:
  - dimensions `model` and `source`;
  - measures: each token count the provider reported (a missing one is left out, never 0), `costMicroUsd` from the usage, and `chargeMicroUsd` from `getAiUsageAmountMicroUsd(usage, chargeRates[model], cacheTtl)`, the same function the processor priced the cost with;
  - a model with no charge rate is charged at `defaultChargeRates` and logs a warning naming the model, so a missing rate is never free and still shows up;
  - any failure is caught and logged at error. A count must never break an AI reply.

### The chat feature

- `usageReport?: { reportName; chargeRates }` on `EventDocAiOptions`, held in a global like the chat's other settings.
- `askEventDocAiStreamTurn` calls `askAiUsageReport` once per execution, after the reply is read and saved, with the chat's model, its cache lifetime, and its document type (`EVENT_DOC_TYPE_GLOBAL`) as the source.
- When the stream has no `Finish` part (it errored, or the user stopped it), the usage is the sum of its `FinishStep` parts, so tokens Bedrock billed for are still counted. A pure `getEventDocAiPartsUsage(parts)` does both cases, and the saved message usage uses it too.
- Each reply is saved with the usage the client may see, from `askEventDocAiReplyUsage`: its tokens and its `chargeMicroUsd` (worked out with the same `getAiUsageChargeMicroUsd` as the report), never `costMicroUsd`. The finalized message and the history then go to the browser as saved, so `sendUsageToFrontend` is the only switch.
- The live stream never forwards usage: its finish parts carry the platform's cost, and the UI only reads usage off finalized messages. `askEventDocAiStreamToUi` loses its `usageVisible` argument.

## Slices

#### Slice 1: framework

Built 10 Nov 2026. Where it differs from the steps below:

- **Five models are unpriced.** Bedrock has no `au.` profile to price for Claude 3.5 Haiku, 3.5 Sonnet, Sonnet 4, Opus 4 or Opus 4.5 (checked against the Bedrock pricing page and the AWS Price List for ap-southeast-2 and ap-southeast-4, published 9 Nov 2026), so `bedrockModelPriceMap` leaves them empty and their calls carry no cost. Since `aiModelMap` points them at `au.` ids, calls to them probably fail on Bedrock today anyway.
- **The processor prices cache writes exactly when it can.** `toBedrockCacheWriteTtl` follows `toBedrockCachePoint`: five minutes when every point lived five minutes (`FiveMinutes`, `ProviderDefault`, or a model that cannot cache for an hour), the hour otherwise. The charge side only has the requested lifetime, so it uses the five minute rate for `FiveMinutes` alone.
- **The chat counts before it saves.** `askEventDocAiUsageReport` runs as soon as the stream is read, before `askEventDocAiReplySave`, because the call was billed whether or not the save works.
- **No separate `getEventDocAiPartsUsage`.** `getEventDocAiStreamUsage` falls back to the sum of the finished steps itself, so the saved message of a stopped reply now carries usage too, where it used to carry none.
- **No cost stripping helpers.** Replies are saved with tokens and the charge only (`toEventDocAiClientUsage`), and the live stream never carries usage, so nothing has to take the cost out on the way to the browser. `chargeMicroUsd` joins `costMicroUsd` on core's `AiStreamUsage`, so `sumAiStreamUsage` adds charges up for a chat's total.

1. `packages/core/src/actions/ai/`: `AiTokenRates`, `AiModelTokenRates`, `getAiUsageAmountMicroUsd`, `costMicroUsd` on `AiStreamUsage`, and `sumAiStreamUsage` adding it.
2. `packages/actionprocessor-aws/src/getActionProcessor/core/ai/`: `bedrockModelPriceMap`, and `toAiStreamUsage` pricing the usage in both the prompt and the stream processors.
3. `packages/features/src/aiUsage/`: `constants/AI_USAGE_REPORT_EVENT` (`aiUsage`), `logic/askAiUsageReport.ts`, and the barrel.
4. `packages/features/src/eventDocAi/`: the `usageReport` option and its global, `getEventDocAiPartsUsage`, the call in `askEventDocAiStreamTurn`, and the cost stripped in the browser-bound redaction.
5. Tests, each checked by breaking what it covers:
   - **Amounts:** each token kind at its rate, a missing kind left out, no double count of `inputTokens`, the five minute write price only for `FiveMinutes` and the one hour price for everything else, whole micro-dollars, sums adding the cost.
   - **Processor pricing:** a model's price by the region it ran on, every listed model priced.
   - **Append (`runStory`):** one event with the right dimensions and measures, the default charge (and a warning) for a model without a rate, a refused append logged and not thrown, the event filed under the caller's scope.
   - **Chat:** a finished turn counts its `Finish` usage once; a stopped one counts the sum of its steps; a turn split over two executions counts twice, adding up to the whole; no count without `usageReport`; the browser never sees `costMicroUsd`, with usage visible or not.
6. Docs: `docs/actions/features/ai-usage/ask-ai-usage-report.md`, the `usageReport` option on the `defineEventDocAi` page, and the cost on the `askAiPrompt` and `askAiPromptStream` pages. `breaking-changes.md` untouched (additive).
7. A release, before DocGen can deploy it. Locally DocGen runs against the hand-linked build.

#### Slice 2: DocGen (doccypoccy, branch `reports`)

8. `DOCGEN_AI_CHARGE_RATES` in an app package (an `AiModelTokenRates`: US dollars per million tokens, per model, one set for every tenant), `DOCGEN_AI_DEFAULT_CHARGE_RATES` at or above the dearest of them, and `DOCGEN_AI_USAGE_REPORT` passed as `usageReport` to all four chats in the template service's infrastructure.
9. Views in `DOCGEN_REPORT_VIEWS`: charge this month and last month (the headline and its change), and charge by chat type per day over the last 30 days (a line per chat type, like the renders panel).
10. A client dashboard panel: AI charges this month in US dollars, with a line per chat type. The design gets its own look once the numbers are real.
11. Check on the local dev server: a message in the template AI chat shows one event per model call under the tenant, with tokens matching the chat bubble, and a cost and charge that match both tables by hand; the browser's copy of the chat has no cost in it. A real Bedrock call, a few cents.

## Out of scope

- **Checking against the real bill.** A monthly internal comparison of the cost with Bedrock's line in Cost Explorer, to keep the price table honest.
- **Showing the charge in the chat bubble.** The chat has the usage and could work out the charge, but the dashboard comes first.
- **Per user.** Categories only, per the reports feature's rule that dimensions are never identifiers.
- **A stream that throws while it's being read.** The parts read so far are lost with it, so those tokens go uncounted. Rare, and the error is already logged.
- **AI calls outside any scope** (a future background job). They'd land in the unscoped partition, which no tenant reads. None exist today.
- **Totals across tenants.** AWS shows what Bedrock costs overall (decision 11).
- **Rates per tenant** (plans, discounts). Later they only change which rates the charge is worked out with; the event keeps its shape.

## Open questions for Joe

None left. All answered on 10 Nov 2026 (the decisions above).
