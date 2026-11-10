import {
  AiActionType,
  AiModel,
  AiStreamFinishReasonEnum,
  AiStreamPartType,
  ConfigActionType,
  DateActionType,
  EventBusActionType,
  FileActionType,
  GuidActionType,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  LogActionType,
  StateActionType,
  StreamActionType,
  SystemActionType,
} from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_STORAGE_DRIVE_GLOBAL, EVENT_DOC_TYPE_GLOBAL } from '../../eventDoc';
import { reportConfigGlobal } from '../../reports/constants/reportConfigGlobal';
import { EVENT_DOC_AI_CONTINUATION_NUDGE } from '../constants/eventDocAiContinuationNudge';
import { EVENT_DOC_AI_DECLINED_NOTICE } from '../constants/eventDocAiDeclinedNotice';
import { EVENT_DOC_AI_ERROR_NOTICE } from '../constants/eventDocAiErrorNotice';
import {
  EVENT_DOC_AI_CACHE_TTL_GLOBAL,
  EVENT_DOC_AI_CHAT_DRIVE_GLOBAL,
  EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL,
  EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL,
  EVENT_DOC_AI_MODEL_GLOBAL,
  EVENT_DOC_AI_NAME_GLOBAL,
  EVENT_DOC_AI_REASONING_EFFORT_GLOBAL,
  EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL,
  EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL,
  EVENT_DOC_AI_USAGE_REPORT_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatMessage } from '../models';
import { EventDocAiEffect } from '../module/effects/EventDocAiEffect';
import type { EventDocAiUsageReport } from '../types/EventDocAiUsageReport';
import { askEventDocAiStreamTurn } from './askEventDocAiStreamTurn';

const baseGlobals: Record<string, unknown> = {
  [EVENT_DOC_AI_NAME_GLOBAL]: 'docs-ai',
  [EVENT_DOC_AI_MODEL_GLOBAL]: AiModel.ClaudeSonnet46,
  [EVENT_DOC_AI_REASONING_EFFORT_GLOBAL]: null,
  [EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL]: 65536,
  [EVENT_DOC_AI_CACHE_TTL_GLOBAL]: '1h',
  [EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL]: 'You are the docs assistant.',
  [EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL]: '',
  [EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL]: 'buildContext',
  [EVENT_DOC_AI_CHAT_DRIVE_GLOBAL]: 'chat-drive',
  [EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL]: 'chat-list',
  [EVENT_DOC_STORAGE_DRIVE_GLOBAL]: 'doc-assets',
  [EVENT_DOC_TYPE_GLOBAL]: 'template',
  [reportConfigGlobal('docgen')]: { utcOffset: '+10:00', financialYearStartMonth: 7, scoped: true, views: {}, events: {} },
};

const usageReport: EventDocAiUsageReport = {
  reportName: 'docgen',
  chargeRates: { [AiModel.ClaudeSonnet46]: { input: 6, output: 30, cacheRead: 0.6, cacheWriteFiveMinutes: 7.5, cacheWriteOneHour: 12 } },
  defaultChargeRates: { input: 20, output: 100, cacheRead: 2, cacheWriteFiveMinutes: 25, cacheWriteOneHour: 40 },
};

const history: EventDocAiChatMessage[] = [
  { role: 'user', segments: [{ type: 'text', text: 'What is in the document?' }] },
  { role: 'assistant', segments: [{ type: 'text', text: 'A heading and two paragraphs.' }] },
  { role: 'user', segments: [{ type: 'text', text: 'Add a third paragraph.' }] },
];

const usage = {
  inputTokens: 1200,
  outputTokens: 40,
  totalTokens: 1240,
  cacheReadInputTokens: 1100,
  cacheWriteInputTokens: 80,
  noCacheInputTokens: 20,
};

type DispatchedEffect = { type: EventDocAiEffect; payload: Record<string, unknown> };

type TurnOptions = {
  isContinuation?: boolean;
  sendUsageToFrontend?: boolean;
  usageReport?: EventDocAiUsageReport;
  /** The parts the model streams back; defaults to one text reply that ends normally. */
  parts?: Record<string, unknown>[];
};

// Drives one turn to completion: the model streams a single text reply, then the
// history save and chat touch run. Captures what the prompt, the save and the browser received.
const defaultParts: Record<string, unknown>[] = [
  { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Done.' },
  { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage },
];

const runTurn = ({ isContinuation = false, sendUsageToFrontend, usageReport: report, parts = defaultParts }: TurnOptions = {}) => {
  const globals: Record<string, unknown> = {
    ...baseGlobals,
    [EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL]: sendUsageToFrontend,
    [EVENT_DOC_AI_USAGE_REPORT_GLOBAL]: report ?? null,
  };
  const counted: { type: string; dimensions: unknown; measures: unknown }[] = [];
  const chunks = [...parts.map((part) => ({ data: JSON.stringify(part) })), { done: true }];
  let promptPayload: Record<string, unknown> | undefined;
  let savedFile: { messages: EventDocAiChatMessage[] } | undefined;
  const dispatched: DispatchedEffect[] = [];

  const result = runStory(askEventDocAiStreamTurn('doc-1', 'chat-1', history, { isContinuation, lengthResumes: 0 }), {
    [SystemActionType.GetRuntimeRemainingTime]: 600_000,
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',
    [InlineFunctionActionType.Execute]: 'Document is at version 3.',
    [AiActionType.PromptStream]: (action: { payload: Record<string, unknown> }) => {
      promptPayload = action.payload;
      return { id: 'stream-1', encoding: 'json' };
    },
    [StreamActionType.Read]: () => chunks.shift(),
    [StreamActionType.Close]: undefined,
    [StateActionType.Dispatch]: (action: { payload: { action: DispatchedEffect } }) => {
      dispatched.push(action.payload.action);
    },
    [FileActionType.WriteObjectJson]: (action: { payload: { data: { messages: EventDocAiChatMessage[] } } }) => {
      savedFile = action.payload.data;
    },
    [KeyValueStoreActionType.Query]: { items: [] },
    [DateActionType.Now]: '2026-11-10T05:00:00.000Z',
    [GuidActionType.NewSortableMany]: (action: { payload: { count: number } }) =>
      Array.from({ length: action.payload.count }, (_, index) => `dedup-${index}`),
    [EventBusActionType.SendMessage]: (action: { payload: { eventBusMessages: { payload: { events: typeof counted } }[] } }) => {
      counted.push(...action.payload.eventBusMessages.flatMap((message) => message.payload.events));
    },
    [LogActionType.Create]: undefined,
  });

  const streamedFinish = dispatched.find(
    (effect) => effect.type === EventDocAiEffect.AppendStreamChunk && (effect.payload.part as { type: string }).type === AiStreamPartType.Finish,
  )?.payload.part as { usage: unknown } | undefined;
  const appendedMessage = dispatched.find((effect) => effect.type === EventDocAiEffect.AppendChatMessage)?.payload.message as
    EventDocAiChatMessage | undefined;

  return { result, promptPayload, savedFile, streamedFinish, appendedMessage, counted };
};

const savedReply: EventDocAiChatMessage = { role: 'assistant', segments: [{ type: 'text', text: 'Done.' }], model: AiModel.ClaudeSonnet46, usage };

describe('askEventDocAiStreamTurn', () => {
  it('sends the saved history as messages and the generated context as turn context, never mixing them', () => {
    const { result, promptPayload } = runTurn();

    expect(result).toEqual({ complete: true });
    expect(promptPayload).toEqual(
      expect.objectContaining({
        model: AiModel.ClaudeSonnet46,
        system: 'You are the docs assistant.',
        aiName: 'docs-ai',
        caching: true,
        cacheTtl: '1h',
        maxOutputTokens: 65536,
        messages: [
          { role: 'user', content: 'What is in the document?' },
          { role: 'assistant', content: 'A heading and two paragraphs.' },
          { role: 'user', content: 'Add a third paragraph.' },
        ],
        turnContext: [{ role: 'user', content: 'Document is at version 3.' }],
      }),
    );
  });

  it('adds the continuation nudge after the context when resuming', () => {
    const { promptPayload } = runTurn({ isContinuation: true });

    expect(promptPayload?.turnContext).toEqual([
      { role: 'user', content: 'Document is at version 3.' },
      { role: 'user', content: EVENT_DOC_AI_CONTINUATION_NUDGE },
    ]);
    expect(promptPayload?.messages).toHaveLength(history.length);
  });

  it('saves an apology quoting the provider error when the request fails, so the turn is not silent', () => {
    const message = 'The security token included in the request is expired';
    const { savedFile, result } = runTurn({
      parts: [
        { type: AiStreamPartType.Error, message },
        { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.error, usage: {} },
      ],
    });

    expect(savedFile?.messages[history.length]).toEqual(
      expect.objectContaining({
        role: 'assistant',
        segments: [{ type: 'text', text: `${EVENT_DOC_AI_ERROR_NOTICE} "${message}"` }],
        model: AiModel.ClaudeSonnet46,
      }),
    );
    expect(result).toEqual({ complete: true });
  });

  it('saves a declined notice as the reply when the model refuses, so the turn is not silent', () => {
    const { savedFile, result } = runTurn({
      parts: [{ type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.contentFilter, rawFinishReason: 'refusal', usage }],
    });

    expect(savedFile?.messages[history.length]).toEqual({
      role: 'assistant',
      segments: [{ type: 'text', text: EVENT_DOC_AI_DECLINED_NOTICE }],
      model: AiModel.ClaudeSonnet46,
      usage,
    });
    expect(result).toEqual({ complete: true });
  });

  it('saves the reply with its model and usage, without the turn context', () => {
    const { savedFile } = runTurn({ isContinuation: true });

    expect(savedFile).toEqual({ messages: [...history, savedReply] });
  });

  it('keeps usage away from the browser by default while still saving it', () => {
    const { savedFile, streamedFinish, appendedMessage } = runTurn();

    expect(savedFile?.messages[history.length]?.usage).toEqual(usage);
    expect(streamedFinish?.usage).toEqual({});
    expect(appendedMessage).toEqual({ role: 'assistant', segments: [{ type: 'text', text: 'Done.' }], model: AiModel.ClaudeSonnet46 });
  });

  it('lets usage through on the finalized message when the chat asks for it, never on the live stream', () => {
    const { streamedFinish, appendedMessage } = runTurn({ sendUsageToFrontend: true });

    expect(streamedFinish?.usage).toEqual({});
    expect(appendedMessage).toEqual(savedReply);
  });

  it('counts the model call once in the usage report, with the chat type as the source', () => {
    const { counted } = runTurn({ usageReport });

    expect(counted).toEqual([
      expect.objectContaining({
        type: 'aiUsage',
        dimensions: { model: AiModel.ClaudeSonnet46, source: 'template' },
        // 20 x 6 + 1,100 x 0.6 + 80 x 12 + 40 x 30, the chat's '1h' cache priced at the hour write rate
        measures: expect.objectContaining({ inputTokens: 1200, outputTokens: 40, chargeMicroUsd: 120 + 660 + 960 + 1200 }),
      }),
    ]);
  });

  it("charges a model missing from the chat's rates at its default rate", () => {
    const { counted } = runTurn({ usageReport: { ...usageReport, chargeRates: {} } });

    // 20 x 20 + 1,100 x 2 + 80 x 40 + 40 x 100
    expect(counted).toEqual([expect.objectContaining({ measures: expect.objectContaining({ chargeMicroUsd: 400 + 2200 + 3200 + 4000 }) })]);
  });

  it('counts nothing when the chat has no usage report', () => {
    expect(runTurn().counted).toEqual([]);
  });

  it('counts a stopped reply by the steps that finished', () => {
    const { counted } = runTurn({
      usageReport,
      parts: [
        { type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage: { inputTokens: 100, outputTokens: 10 } },
        { type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage: { inputTokens: 200, outputTokens: 5 } },
      ],
    });

    expect(counted).toEqual([expect.objectContaining({ measures: expect.objectContaining({ inputTokens: 300, outputTokens: 15 }) })]);
  });

  it('saves and shows the reply with its charge, never what it cost the platform, which only the report gets', () => {
    const pricedUsage = { ...usage, costMicroUsd: 1_234 };
    // 20 x 6 + 1,100 x 0.6 + 80 x 12 + 40 x 30, the chat's '1h' cache charged at the hour write rate
    const clientUsage = { ...usage, chargeMicroUsd: 120 + 660 + 960 + 1200 };
    const { streamedFinish, appendedMessage, savedFile, counted } = runTurn({
      usageReport,
      sendUsageToFrontend: true,
      parts: [
        { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Done.' },
        { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage: pricedUsage },
      ],
    });

    expect(streamedFinish?.usage).toEqual({});
    expect(appendedMessage?.usage).toEqual(clientUsage);
    expect(savedFile?.messages[savedFile.messages.length - 1]?.usage).toEqual(clientUsage);
    expect(counted[0]?.measures).toMatchObject({ costMicroUsd: 1_234, chargeMicroUsd: clientUsage.chargeMicroUsd });
  });
});
