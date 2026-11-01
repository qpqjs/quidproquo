import { ErrorTypeEnum, LogActionType, LogLevelEnum, StateActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ServiceActionType } from '../../webSocketQueue/actions/ServiceActionType';
import type { EventDocAiChatMessage } from '../models';
import { EventDocAiEffect } from '../module/effects/EventDocAiEffect';
import { askEventDocAiSendMessage } from './askEventDocAiSendMessage';

type Dispatched = { type: EventDocAiEffect; payload: Record<string, unknown> };
type ServiceCall = { method: string; payload: Record<string, unknown> };

const staleSnapshot: EventDocAiChatMessage[] = [{ role: 'assistant', segments: [{ type: 'text', text: 'Earlier reply.' }] }];
const serverHistory: EventDocAiChatMessage[] = [
  ...staleSnapshot,
  { role: 'user', segments: [{ type: 'text', text: 'New question' }] },
  { role: 'assistant', segments: [{ type: 'text', text: 'Partial reply the server already saved.' }] },
];

// Drives a send whose request fails. `activeChatOnReload` is what the state answers when the story
// re-reads it after the failure; `historyFails` makes the reload request fail too.
const runFailedSend = ({ activeChatOnReload = 'chat-1', historyFails = false } = {}) => {
  const dispatched: Dispatched[] = [];
  const serviceCalls: ServiceCall[] = [];
  const logs: { logLevel: LogLevelEnum; msg: string }[] = [];
  let reads = 0;

  runStory(askEventDocAiSendMessage('New question'), {
    [StateActionType.Read]: () => ({ activeChatId: reads++ === 0 ? 'chat-1' : activeChatOnReload, chatMessages: staleSnapshot }),
    [StateActionType.Dispatch]: (action: { payload: { action: Dispatched } }) => {
      dispatched.push(action.payload.action);
      return undefined;
    },
    [ServiceActionType.Request]: (action: { payload: ServiceCall }) => {
      serviceCalls.push(action.payload);
      if (action.payload.method.endsWith('ChatSend')) {
        return throwsError(ErrorTypeEnum.GenericError, 'model unavailable');
      }
      return historyFails ? throwsError(ErrorTypeEnum.GenericError, 'history unavailable') : serverHistory;
    },
    [LogActionType.Create]: (action: { payload: { logLevel: LogLevelEnum; msg: string } }) => {
      logs.push(action.payload);
      return undefined;
    },
  });

  const setMessages = dispatched.filter((effect) => effect.type === EventDocAiEffect.SetMessages);
  const historyCalls = serviceCalls.filter((call) => call.method.endsWith('ChatHistory'));

  return { dispatched, setMessages, historyCalls, logs };
};

describe('askEventDocAiSendMessage', () => {
  it('reloads the chat from the server when the send fails, not from the pre-send snapshot', () => {
    const { setMessages, historyCalls } = runFailedSend();

    expect(historyCalls).toEqual([
      expect.objectContaining({ method: expect.stringMatching(/ChatHistory$/), payload: expect.objectContaining({ chatId: 'chat-1' }) }),
    ]);
    expect(setMessages).toHaveLength(1);
    expect(setMessages[0]!.payload).toEqual({ messages: serverHistory });
  });

  it('leaves the chat alone when the user switched chats during the send', () => {
    const { setMessages, historyCalls } = runFailedSend({ activeChatOnReload: 'chat-2' });

    expect(historyCalls).toEqual([]);
    expect(setMessages).toEqual([]);
  });

  it('logs a warning and keeps the shown messages when the reload itself fails', () => {
    const { setMessages, logs } = runFailedSend({ historyFails: true });

    expect(setMessages).toEqual([]);
    expect(logs).toEqual([expect.objectContaining({ logLevel: LogLevelEnum.Warn, msg: expect.stringMatching(/could not be reloaded/) })]);
  });
});
