import {
  AiModel,
  ConfigActionType,
  ContextActionType,
  FileActionType,
  QueueEvent,
  QueueMessage,
  runStory,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_TYPE_GLOBAL, EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../../eventDoc';
import { websocketConnectionInfoContext } from '../../../webSocketQueue/context';
import {
  EVENT_DOC_AI_CHAT_DRIVE_GLOBAL,
  EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL,
  EVENT_DOC_AI_SERVICE_NAME_GLOBAL,
} from '../../constants/eventDocAiGlobalNames';
import type { EventDocAiChatMessage } from '../../models';
import { onChatHistory } from './onChatHistory';

const usage = { inputTokens: 1200, cacheReadInputTokens: 1100 };

const savedMessages: EventDocAiChatMessage[] = [
  { role: 'user', segments: [{ type: 'text', text: 'Hi' }] },
  { role: 'assistant', segments: [{ type: 'text', text: 'Hello.' }], model: AiModel.ClaudeSonnet46, usage },
];

const readContextByIdentifier = (action: { payload: { contextIdentifier: { uniqueName: string; defaultValue: unknown } } }) =>
  action.payload.contextIdentifier.uniqueName === websocketConnectionInfoContext.uniqueName
    ? { apiName: 'ws-api', connectionId: 'conn-1', correlationId: 'ws-corr-1' }
    : action.payload.contextIdentifier.defaultValue;

// Serves the saved history over the websocket and returns what the browser was sent.
const serveHistory = (sendUsageToFrontend: boolean): EventDocAiChatMessage[] => {
  const globals: Record<string, unknown> = {
    [EVENT_DOC_AI_SERVICE_NAME_GLOBAL]: 'log',
    [EVENT_DOC_TYPE_GLOBAL]: 'log',
    [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'admin-users',
    [EVENT_DOC_AI_CHAT_DRIVE_GLOBAL]: 'chat-drive',
    [EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL]: sendUsageToFrontend,
  };
  const sentMessages: { payload: { result: EventDocAiChatMessage[] } }[] = [];

  const event: QueueEvent<QueueMessage<any>> = {
    id: 'q-1',
    message: { payload: { chatId: 'chat-1', docId: 'corr-1' } } as QueueMessage<any>,
  };

  runStory(onChatHistory(event), {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',
    [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe' },
    [ContextActionType.Read]: readContextByIdentifier,
    [FileActionType.Exists]: true,
    [FileActionType.ReadObjectJson]: { messages: savedMessages },
    [WebsocketActionType.SendMessage]: (action: { payload: { payload: { payload: { result: EventDocAiChatMessage[] } } } }) => {
      sentMessages.push(action.payload.payload);
    },
  });

  expect(sentMessages).toHaveLength(1);

  return sentMessages[0].payload.result;
};

describe('onChatHistory', () => {
  it('strips usage from the history it sends by default', () => {
    expect(serveHistory(false)).toEqual([
      { role: 'user', segments: [{ type: 'text', text: 'Hi' }] },
      { role: 'assistant', segments: [{ type: 'text', text: 'Hello.' }], model: AiModel.ClaudeSonnet46 },
    ]);
  });

  it('sends the history as saved when the chat lets usage through', () => {
    expect(serveHistory(true)).toEqual(savedMessages);
  });
});
