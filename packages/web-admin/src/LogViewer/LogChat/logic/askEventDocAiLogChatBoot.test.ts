import { ContextActionType, runStory, StateActionType } from 'quidproquo-core';
import { eventDocAiContext, ServiceActionType } from 'quidproquo-features';

import { describe, expect, it } from 'vitest';

import { askEventDocAiLogChatBoot } from './askEventDocAiLogChatBoot';

const docContext = { serviceName: 'log', type: 'log', docId: 'corr-1' };

const baseMocks = (chats: { chatId: string; updatedAt: string }[], requests: { method: string; payload: unknown }[]) => ({
  [ContextActionType.Read]: (action: { payload: { contextIdentifier: { uniqueName: string } } }) =>
    action.payload.contextIdentifier.uniqueName === eventDocAiContext.uniqueName ? docContext : {},
  [StateActionType.Dispatch]: () => {},
  [StateActionType.Read]: () => ({ chats }),
  [ServiceActionType.Request]: (action: { payload: { method: string; payload: unknown } }) => {
    requests.push({ method: action.payload.method, payload: action.payload.payload });

    return action.payload.method.endsWith('ChatList') ? chats : [];
  },
});

describe('askEventDocAiLogChatBoot', () => {
  it('selects the most recently updated chat after loading the list', () => {
    const requests: { method: string; payload: unknown }[] = [];
    const chats = [
      { chatId: 'chat-old', updatedAt: '2026-07-10T00:00:00.000Z' },
      { chatId: 'chat-new', updatedAt: '2026-07-11T00:00:00.000Z' },
    ];

    runStory(askEventDocAiLogChatBoot(), baseMocks(chats, requests));

    const historyRequest = requests.find((r) => r.method.endsWith('ChatHistory'));
    expect(historyRequest?.payload).toEqual({ chatId: 'chat-new', docId: 'corr-1' });
  });

  it('does not request history when the log has no chats yet', () => {
    const requests: { method: string; payload: unknown }[] = [];

    runStory(askEventDocAiLogChatBoot(), baseMocks([], requests));

    expect(requests.some((r) => r.method.endsWith('ChatHistory'))).toBe(false);
  });
});
