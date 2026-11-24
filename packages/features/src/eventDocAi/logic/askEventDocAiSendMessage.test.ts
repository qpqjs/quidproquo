import { ErrorTypeEnum, LogActionType, LogLevelEnum, StateActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ServiceActionType } from '../../webSocketQueue/actions/ServiceActionType';
import { EVENT_DOC_AI_REQUEST_TIMEOUT_MS } from '../constants/eventDocAiRequestTimeoutMs';
import type { EventDocAiChatRow, EventDocAiMessageSegment } from '../models';
import { EventDocAiChatRowDataType } from '../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import { EventDocAiEffect } from '../module/effects/EventDocAiEffect';
import { askEventDocAiSendMessage } from './askEventDocAiSendMessage';

type Dispatched = { type: EventDocAiEffect; payload: Record<string, unknown> };
type ServiceCall = { method: string; payload: Record<string, unknown>; timeoutMs?: number };

const textRow = (sk: string, role: 'user' | 'assistant', value: string): EventDocAiChatRow => ({
  sk,
  messageId: sk,
  role,
  kind: EventDocAiChatRowKind.Text,
  data: { type: EventDocAiChatRowDataType.Inline, content: value },
});

// What the server holds for the chat: more than the browser had before the send.
const serverRows: EventDocAiChatRow[] = [
  textRow('row-1', 'assistant', 'Earlier reply.'),
  textRow('row-2', 'user', 'New question'),
  textRow('row-3', 'assistant', 'Partial reply the server already saved.'),
];

type SendOptions = {
  /** Makes the send request fail. */
  sendFails?: boolean;
  /** What the state answers for the open chat when the story re-reads it after the send. */
  activeChatAfterSend?: string;
  /** Whether the state says part of the reply never reached this browser. */
  isHistoryStale?: boolean;
  /** What is still streaming when the send ends; a finalized reply leaves nothing. */
  streamSegments?: EventDocAiMessageSegment[];
  /** Makes the history request fail. */
  historyFails?: boolean;
};

// Drives one send and captures what it dispatched and asked the server for.
const runSend = ({
  sendFails = false,
  activeChatAfterSend = 'chat-1',
  isHistoryStale = false,
  streamSegments = [],
  historyFails = false,
}: SendOptions = {}) => {
  const dispatched: Dispatched[] = [];
  const serviceCalls: ServiceCall[] = [];
  const logs: { logLevel: LogLevelEnum; msg: string }[] = [];
  let reads = 0;

  runStory(askEventDocAiSendMessage('New question'), {
    [StateActionType.Read]: () => ({ activeChatId: reads++ === 0 ? 'chat-1' : activeChatAfterSend, isHistoryStale, streamSegments }),
    [StateActionType.Dispatch]: (action: { payload: { action: Dispatched } }) => {
      dispatched.push(action.payload.action);
      return undefined;
    },
    [ServiceActionType.Request]: (action: { payload: ServiceCall }) => {
      serviceCalls.push(action.payload);
      if (action.payload.method.endsWith('ChatSend')) {
        return sendFails ? throwsError(ErrorTypeEnum.GenericError, 'model unavailable') : { complete: true };
      }
      return historyFails ? throwsError(ErrorTypeEnum.GenericError, 'history unavailable') : { rows: serverRows, hasMore: false };
    },
    [LogActionType.Create]: (action: { payload: { logLevel: LogLevelEnum; msg: string } }) => {
      logs.push(action.payload);
      return undefined;
    },
  });

  const reloads = dispatched.filter((effect) => effect.type === EventDocAiEffect.SetChatRows);
  const historyCalls = serviceCalls.filter((call) => call.method.endsWith('ChatHistory'));
  const sendCalls = serviceCalls.filter((call) => call.method.endsWith('ChatSend'));

  return { dispatched, reloads, historyCalls, sendCalls, logs };
};

describe('askEventDocAiSendMessage', () => {
  it('reloads the chat from the server when the send fails, not from the pre-send snapshot', () => {
    const { reloads, historyCalls } = runSend({ sendFails: true });

    expect(historyCalls).toEqual([
      expect.objectContaining({ method: expect.stringMatching(/ChatHistory$/), payload: expect.objectContaining({ chatId: 'chat-1' }) }),
    ]);
    expect(reloads.map((effect) => effect.payload)).toEqual([{ chatId: 'chat-1', rows: serverRows }]);
  });

  // A reload happens while the chat is on screen, so it must never pass through an empty chat.
  it('replaces the rows in one go on a reload, never emptying the chat or adding to it page by page', () => {
    const { dispatched } = runSend({ sendFails: true });
    const afterSend = dispatched.slice(dispatched.findIndex((effect) => effect.type === EventDocAiEffect.SetChatRows));

    expect(dispatched.some((effect) => effect.type === EventDocAiEffect.PrependChatRows)).toBe(false);
    expect(dispatched.some((effect) => effect.type === EventDocAiEffect.SetMessages)).toBe(false);
    expect(afterSend.map((effect) => effect.type)).toEqual([EventDocAiEffect.SetChatRows]);
  });

  it('leaves the chat as it is after a send that worked and reached this browser in full', () => {
    const { reloads, historyCalls } = runSend();

    expect(historyCalls).toEqual([]);
    expect(reloads).toEqual([]);
  });

  it('reloads the chat after a send that worked when part of the reply never reached this browser', () => {
    const { reloads } = runSend({ isHistoryStale: true });

    expect(reloads.map((effect) => effect.payload)).toEqual([{ chatId: 'chat-1', rows: serverRows }]);
  });

  // The reply is saved on the server, so a lost signal must never leave the person with a reply that vanished.
  it('reloads the chat when the reply was streamed but the signal to finalize it never arrived', () => {
    const { reloads } = runSend({ streamSegments: [{ type: 'text', text: 'Done.' }] });

    expect(reloads.map((effect) => effect.payload)).toEqual([{ chatId: 'chat-1', rows: serverRows }]);
  });

  it('leaves the chat alone when the user switched chats during the send', () => {
    const { reloads, historyCalls } = runSend({ sendFails: true, activeChatAfterSend: 'chat-2' });

    expect(historyCalls).toEqual([]);
    expect(reloads).toEqual([]);
  });

  it('logs a warning and keeps the shown messages when the reload itself fails', () => {
    const { reloads, logs } = runSend({ sendFails: true, historyFails: true });

    expect(reloads).toEqual([]);
    expect(logs).toEqual([expect.objectContaining({ logLevel: LogLevelEnum.Warn, msg: expect.stringMatching(/could not be reloaded/) })]);
  });

  it('gives the history request a time limit and the send none, since a turn can run for minutes', () => {
    const { historyCalls, sendCalls } = runSend({ sendFails: true });

    expect(historyCalls[0]!.timeoutMs).toBe(EVENT_DOC_AI_REQUEST_TIMEOUT_MS);
    expect(sendCalls[0]!.timeoutMs).toBeUndefined();
  });
});
