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
  EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL,
  EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL,
  EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL,
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
import { EVENT_DOC_AI_STREAM_PART_MAX_BYTES } from '../constants/eventDocAiStreamPartMaxBytes';
import type { EventDocAiChatMessage, EventDocAiChatRow } from '../models';
import { EventDocAiChatRowDataType } from '../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import { EventDocAiEffect } from '../module/effects/EventDocAiEffect';
import type { EventDocAiEffects } from '../module/effects/EventDocAiEffects';
import { eventDocAiReducer } from '../module/eventDocAiReducer';
import { createInitialEventDocAiState } from '../module/logic/createInitialEventDocAiState';
import { eventDocAiChatRowsToMessages } from '../module/logic/eventDocAiChatRowsToMessages';
import type { EventDocAiState } from '../module/types/EventDocAiState';
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
  [EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL]: 'chat-blobs',
  [EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL]: 'chat-rows',
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
  const savedRows: EventDocAiChatRow[] = [];
  const savedBlobs: string[] = [];
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
    [KeyValueStoreActionType.UpsertMany]: (action: { payload: { items: (EventDocAiChatRow & { pk: string })[] } }) => {
      savedRows.push(...action.payload.items.map(({ pk: _pk, ...row }) => row as EventDocAiChatRow));
    },
    [FileActionType.WriteObjectJson]: (action: { payload: { filepath: string } }) => {
      savedBlobs.push(action.payload.filepath);
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
  const finalized = dispatched.find((effect) => effect.type === EventDocAiEffect.FinalizeStream)?.payload;
  const streamedParts = dispatched
    .filter((effect) => effect.type === EventDocAiEffect.AppendStreamChunk)
    .map((effect) => effect.payload.part as { type: string });

  // What the turn added to the chat, as the message its rows make up. Values moved to the blobs drive read as not loaded.
  const [savedMessage] = eventDocAiChatRowsToMessages(savedRows);

  return { result, promptPayload, savedMessage, savedRows, savedBlobs, streamedFinish, finalized, streamedParts, dispatched, counted };
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
    const { savedMessage, result } = runTurn({
      parts: [
        { type: AiStreamPartType.Error, message },
        { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.error, usage: {} },
      ],
    });

    expect(savedMessage).toEqual(
      expect.objectContaining({
        role: 'assistant',
        segments: [{ type: 'text', text: `${EVENT_DOC_AI_ERROR_NOTICE} "${message}"` }],
        model: AiModel.ClaudeSonnet46,
      }),
    );
    expect(result).toEqual({ complete: true });
  });

  it('saves a declined notice as the reply when the model refuses, so the turn is not silent', () => {
    const { savedMessage, result } = runTurn({
      parts: [{ type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.contentFilter, rawFinishReason: 'refusal', usage }],
    });

    expect(savedMessage).toEqual({
      role: 'assistant',
      segments: [{ type: 'text', text: EVENT_DOC_AI_DECLINED_NOTICE }],
      model: AiModel.ClaudeSonnet46,
      usage,
    });
    expect(result).toEqual({ complete: true });
  });

  // The chat is only ever added to: a reply saves its own rows and never rewrites what came before.
  it('adds only the reply to the chat, with its model and usage, without the turn context or the earlier messages', () => {
    const { savedMessage, savedRows } = runTurn({ isContinuation: true });

    expect(savedMessage).toEqual(savedReply);
    expect(savedRows.map((row) => [row.role, row.kind])).toEqual([
      ['assistant', 'text'],
      ['assistant', 'usage'],
    ]);
  });

  it('keeps usage away from the browser by default while still saving it', () => {
    const { savedMessage, streamedFinish, finalized } = runTurn();

    expect(savedMessage?.usage).toEqual(usage);
    expect(streamedFinish?.usage).toEqual({});
    expect(finalized).toEqual({ chatId: 'chat-1', model: AiModel.ClaudeSonnet46, trailingSegments: [], isPartial: false });
  });

  it('lets usage through on the finalized message when the chat asks for it, never on the live stream', () => {
    const { streamedFinish, finalized } = runTurn({ sendUsageToFrontend: true });

    expect(streamedFinish?.usage).toEqual({});
    expect(finalized).toEqual(expect.objectContaining({ model: AiModel.ClaudeSonnet46, usage }));
  });

  // The finished reply can be bigger than one websocket message, which is never delivered.
  it('never sends the finished reply to the browser again, only the signal to finalize what it streamed', () => {
    const { dispatched, finalized } = runTurn();

    expect(dispatched.some((effect) => effect.type === EventDocAiEffect.AppendChatMessage)).toBe(false);
    expect(finalized).not.toHaveProperty('segments');
    expect(finalized).not.toHaveProperty('message');
  });

  // The reply is never resent, so what the browser folds from the stream must be exactly what the server saved.
  it('leaves the browser with the same reply the server saved, built only from what was streamed to it', () => {
    const { dispatched, savedMessage } = runTurn({
      parts: [
        { type: AiStreamPartType.ReasoningDelta, id: 'reasoning-1', text: 'The document needs a paragraph.' },
        { type: AiStreamPartType.ToolInputStart, id: 'call-1', toolName: 'editDocument' },
        { type: AiStreamPartType.ToolInputDelta, id: 'call-1', delta: '{"text":' },
        { type: AiStreamPartType.ToolInputDelta, id: 'call-1', delta: '"A third paragraph."}' },
        { type: AiStreamPartType.ToolCall, toolCallId: 'call-1', toolName: 'editDocument', input: { text: 'A third paragraph.' } },
        { type: AiStreamPartType.ToolResult, toolCallId: 'call-1', toolName: 'editDocument', output: { version: 4 } },
        { type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage },
        { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Added ' },
        { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'the paragraph.' },
        { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage },
      ],
    });

    const browser = dispatched.reduce<EventDocAiState>((state, effect) => eventDocAiReducer(state, effect as EventDocAiEffects)[0], {
      ...createInitialEventDocAiState(),
      activeChatId: 'chat-1',
    });

    const { usage: _usage, ...savedWithoutUsage } = savedMessage!;

    expect(savedWithoutUsage.segments).toHaveLength(3);
    expect(browser.chatMessages).toEqual([savedWithoutUsage]);
    expect(browser.streamSegments).toEqual([]);
    expect(browser.isStreaming).toBe(false);
    expect(browser.isHistoryStale).toBe(false);
  });

  // A stream left showing is how the browser knows its finalize signal was lost, so the server must not wipe it.
  it('leaves clearing the stream to the finalize signal, and clears it itself only when there is nothing to save', () => {
    const saved = runTurn();
    const empty = runTurn({ parts: [{ type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage }] });

    expect(saved.dispatched.some((effect) => effect.type === EventDocAiEffect.ClearStream)).toBe(false);
    expect(empty.finalized).toBeUndefined();
    expect(empty.dispatched.some((effect) => effect.type === EventDocAiEffect.ClearStream)).toBe(true);
  });

  it('sends a stop notice the browser never streamed along with the signal', () => {
    const { finalized } = runTurn({
      parts: [{ type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.contentFilter, rawFinishReason: 'refusal', usage }],
    });

    expect(finalized).toEqual(
      expect.objectContaining({ trailingSegments: [{ type: 'text', text: EVENT_DOC_AI_DECLINED_NOTICE }], isPartial: false }),
    );
  });

  it('holds back a stream part too big for one websocket message, saves it to the blobs drive and says the browser copy is partial', () => {
    const hugeOutput = { html: 'x'.repeat(EVENT_DOC_AI_STREAM_PART_MAX_BYTES) };
    const { streamedParts, savedRows, savedBlobs, finalized } = runTurn({
      parts: [
        { type: AiStreamPartType.ToolCall, toolCallId: 'call-1', toolName: 'readDocument', input: {} },
        { type: AiStreamPartType.ToolResult, toolCallId: 'call-1', toolName: 'readDocument', output: hugeOutput },
        { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Done.' },
        { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage },
      ],
    });

    expect(streamedParts.map((part) => part.type)).toEqual([AiStreamPartType.ToolCall, AiStreamPartType.TextDelta, AiStreamPartType.Finish]);
    expect(savedRows[0]).toEqual(
      expect.objectContaining({
        kind: EventDocAiChatRowKind.ToolUse,
        toolName: 'readDocument',
        data: { type: EventDocAiChatRowDataType.StorageDrive },
      }),
    );
    expect(savedBlobs).toEqual([`doc-1/chat-1/${savedRows[0]!.sk}.json`]);
    expect(finalized).toEqual(expect.objectContaining({ isPartial: true }));
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
    const { streamedFinish, finalized, savedMessage, counted } = runTurn({
      usageReport,
      sendUsageToFrontend: true,
      parts: [
        { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Done.' },
        { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage: pricedUsage },
      ],
    });

    expect(streamedFinish?.usage).toEqual({});
    expect(finalized?.usage).toEqual(clientUsage);
    expect(savedMessage?.usage).toEqual(clientUsage);
    expect(counted[0]?.measures).toMatchObject({ costMicroUsd: 1_234, chargeMicroUsd: clientUsage.chargeMicroUsd });
  });
});
