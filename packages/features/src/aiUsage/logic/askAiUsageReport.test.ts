import {
  AiCacheTtl,
  AiModel,
  type AiModelTokenRates,
  type AiTokenRates,
  askStorageScopeProvide,
  ConfigActionType,
  DateActionType,
  EventBusActionType,
  GuidActionType,
  LogActionType,
  LogLevelEnum,
} from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { reportConfigGlobal } from '../../reports/constants/reportConfigGlobal';
import { ReportsConfig } from '../../reports/models/ReportsConfig';
import { askAiUsageReport } from './askAiUsageReport';

const CONFIG: ReportsConfig = { utcOffset: '+10:00', financialYearStartMonth: 7, scoped: true, views: {}, events: {} };

// Twice Bedrock's rates for Sonnet 4.6, so the charge can't be mistaken for the cost.
const CHARGE_RATES: AiModelTokenRates = {
  [AiModel.ClaudeSonnet46]: { input: 6, output: 30, cacheRead: 0.6, cacheWriteFiveMinutes: 7.5, cacheWriteOneHour: 12 },
};

// Dearer than any model's own rate, as a default should be.
const DEFAULT_CHARGE_RATES: AiTokenRates = { input: 20, output: 100, cacheRead: 2, cacheWriteFiveMinutes: 25, cacheWriteOneHour: 40 };

const USAGE = {
  inputTokens: 1_200,
  noCacheInputTokens: 100,
  cacheReadInputTokens: 1_000,
  cacheWriteInputTokens: 100,
  outputTokens: 50,
  costMicroUsd: 1_550,
};

type SentEvent = { type: string; dimensions: unknown; measures: unknown };
type Sent = { eventBusMessages: { payload: { scope: string; events: SentEvent[] } }[] };

const run = (story: Parameters<typeof runStory>[0], sendMock?: unknown) => {
  const sent: { scope: string; event: SentEvent }[] = [];
  const logs: { logLevel: string; msg: string }[] = [];

  runStory(story, {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
      action.payload.globalName === reportConfigGlobal('docgen') ? CONFIG : undefined,
    [DateActionType.Now]: '2026-11-10T05:00:00.000Z',
    [GuidActionType.NewSortableMany]: (action: { payload: { count: number } }) =>
      Array.from({ length: action.payload.count }, (_, index) => `dedup-${index}`),
    [EventBusActionType.SendMessage]:
      sendMock ??
      ((action: { payload: Sent }) => {
        sent.push(
          ...action.payload.eventBusMessages.flatMap((message) => message.payload.events.map((event) => ({ scope: message.payload.scope, event }))),
        );
      }),
    [LogActionType.Create]: (action: { payload: { logLevel: string; msg: string } }) => {
      logs.push(action.payload);
    },
  });

  return { sent, logs };
};

describe('askAiUsageReport', () => {
  it('counts the call under the caller scope with its tokens, its cost and its charge', () => {
    const { sent, logs } = run(
      askStorageScopeProvide(
        'TENANT#t1',
        askAiUsageReport('docgen', {
          model: AiModel.ClaudeSonnet46,
          source: 'template',
          usage: USAGE,
          chargeRates: CHARGE_RATES,
          defaultChargeRates: DEFAULT_CHARGE_RATES,
          cacheTtl: AiCacheTtl.Dynamic,
        }),
      ),
    );

    expect(sent).toEqual([
      {
        scope: 'TENANT#t1',
        event: expect.objectContaining({
          type: 'aiUsage',
          dimensions: { model: AiModel.ClaudeSonnet46, source: 'template' },
          measures: {
            inputTokens: 1_200,
            noCacheInputTokens: 100,
            cacheReadInputTokens: 1_000,
            cacheWriteInputTokens: 100,
            outputTokens: 50,
            costMicroUsd: 1_550,
            // 100 x 6 + 1,000 x 0.6 + 100 x 12 (the hour write rate, as Dynamic may write for an hour) + 50 x 30
            chargeMicroUsd: 600 + 600 + 1_200 + 1_500,
          },
        }),
      },
    ]);
    expect(logs).toEqual([]);
  });

  it('charges cache writes at the five minute rate when the call only cached for five minutes', () => {
    const { sent } = run(
      askStorageScopeProvide(
        'TENANT#t1',
        askAiUsageReport('docgen', {
          model: AiModel.ClaudeSonnet46,
          source: 'template',
          usage: { cacheWriteInputTokens: 1_000 },
          chargeRates: CHARGE_RATES,
          defaultChargeRates: DEFAULT_CHARGE_RATES,
          cacheTtl: AiCacheTtl.FiveMinutes,
        }),
      ),
    );

    expect(sent[0]!.event.measures).toEqual({ cacheWriteInputTokens: 1_000, chargeMicroUsd: 7_500 });
  });

  it('charges a model with no charge rate at the default rate, and warns', () => {
    const { sent, logs } = run(
      askStorageScopeProvide(
        'PERSONAL#u1',
        askAiUsageReport('docgen', {
          model: AiModel.ClaudeOpus55,
          source: 'content',
          usage: USAGE,
          chargeRates: CHARGE_RATES,
          defaultChargeRates: DEFAULT_CHARGE_RATES,
        }),
      ),
    );

    expect(sent).toHaveLength(1);
    expect(sent[0]!.scope).toBe('PERSONAL#u1');
    // 100 x 20 + 1,000 x 2 + 100 x 40 + 50 x 100, at the default rate
    expect(sent[0]!.event.measures).toMatchObject({ costMicroUsd: 1_550, chargeMicroUsd: 2_000 + 2_000 + 4_000 + 5_000 });
    expect(logs).toEqual([{ logLevel: LogLevelEnum.Warn, msg: expect.stringContaining(`no charge rate for ${AiModel.ClaudeOpus55}`) }]);
  });

  it('logs a count the report refuses instead of throwing it', () => {
    // An event past the report's size limit is refused by the append's shape check.
    const { sent, logs } = run(
      askStorageScopeProvide(
        'TENANT#t1',
        askAiUsageReport('docgen', {
          model: AiModel.ClaudeSonnet46,
          source: 'x'.repeat(5_000),
          usage: USAGE,
          chargeRates: CHARGE_RATES,
          defaultChargeRates: DEFAULT_CHARGE_RATES,
        }),
      ),
    );

    expect(sent).toEqual([]);
    expect(logs).toEqual([{ logLevel: LogLevelEnum.Error, msg: expect.stringContaining('was not counted') }]);
  });

  it('never throws when the count cannot be sent', () => {
    const { logs } = run(
      askStorageScopeProvide(
        'TENANT#t1',
        askAiUsageReport('docgen', {
          model: AiModel.ClaudeSonnet46,
          source: 'template',
          usage: USAGE,
          chargeRates: CHARGE_RATES,
          defaultChargeRates: DEFAULT_CHARGE_RATES,
        }),
      ),
      throwsError('Throttled', 'slow down'),
    );

    expect(logs).toEqual([{ logLevel: LogLevelEnum.Error, msg: expect.stringContaining('lost 1 event(s) of aiUsage') }]);
  });
});
