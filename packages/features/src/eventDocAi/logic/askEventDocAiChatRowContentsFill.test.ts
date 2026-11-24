import { ErrorTypeEnum, LogActionType, LogLevelEnum, NetworkActionType, StateActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ServiceActionType } from '../../webSocketQueue/actions/ServiceActionType';
import type { EventDocAiChatRow, EventDocAiChatRowData, EventDocAiChatToolUseContent } from '../models';
import { EventDocAiChatRowDataType } from '../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import { EventDocAiEffect } from '../module/effects/EventDocAiEffect';
import { askEventDocAiChatRowContentsFill } from './askEventDocAiChatRowContentsFill';

const toolRow = (sk: string, data: EventDocAiChatRowData<EventDocAiChatToolUseContent>): EventDocAiChatRow => ({
  sk,
  messageId: sk,
  role: 'assistant',
  kind: EventDocAiChatRowKind.ToolUse,
  toolName: 'renderDocument',
  data,
});

const stored = { type: EventDocAiChatRowDataType.StorageDrive } as const;

const rows: EventDocAiChatRow[] = [
  toolRow('row-1', stored),
  toolRow('row-2', { type: EventDocAiChatRowDataType.Inline, content: { input: {}, output: { ok: true } } }),
  toolRow('row-3', stored),
];

type FillOptions = {
  /** The chat the state says is open before each content is fetched, in order; the last one repeats. */
  activeChatIds?: string[];
  /** Row ids whose link request fails. */
  failing?: string[];
  downloadStatus?: number;
};

const runFill = ({ activeChatIds = ['chat-1'], failing = [], downloadStatus = 200 }: FillOptions = {}) => {
  const dispatched: { type: EventDocAiEffect; payload: Record<string, unknown> }[] = [];
  const requested: Record<string, unknown>[] = [];
  const downloaded: string[] = [];
  const redacted: string[] = [];
  const logs: { logLevel: LogLevelEnum; msg: string }[] = [];
  let reads = 0;

  runStory(askEventDocAiChatRowContentsFill('chat-1', rows), {
    [StateActionType.Read]: () => ({ activeChatId: activeChatIds[Math.min(reads++, activeChatIds.length - 1)] }),
    [StateActionType.Dispatch]: (action: { payload: { action: (typeof dispatched)[number] } }) => {
      dispatched.push(action.payload.action);
      return undefined;
    },
    [ServiceActionType.Request]: (action: { payload: { payload: { sk: string } } }) => {
      requested.push(action.payload.payload);
      return failing.includes(action.payload.payload.sk)
        ? throwsError(ErrorTypeEnum.NotFound, 'No such stored chat row content')
        : { url: `https://files.example/${action.payload.payload.sk}?signature=abc` };
    },
    [NetworkActionType.Request]: (action: { payload: { url: string } }) => {
      downloaded.push(action.payload.url);
      return { status: downloadStatus, statusText: '', headers: {}, setCookies: [], data: { content: { input: {}, output: action.payload.url } } };
    },
    [LogActionType.RedactString]: (action: { payload: { value: string } }) => {
      redacted.push(action.payload.value);
      return undefined;
    },
    [LogActionType.Create]: (action: { payload: { logLevel: LogLevelEnum; msg: string } }) => {
      logs.push(action.payload);
      return undefined;
    },
  });

  return { dispatched, requested, downloaded, redacted, logs };
};

describe('askEventDocAiChatRowContentsFill', () => {
  // A row that holds its own content must cost nothing: no request and no download.
  it('fetches only the rows whose content is held in storage, newest first, and puts each on its row', () => {
    const { requested, downloaded, dispatched } = runFill();

    expect(requested).toEqual([
      expect.objectContaining({ chatId: 'chat-1', sk: 'row-3' }),
      expect.objectContaining({ chatId: 'chat-1', sk: 'row-1' }),
    ]);
    expect(downloaded).toHaveLength(2);
    expect(dispatched).toEqual([
      {
        type: EventDocAiEffect.SetChatRowContent,
        payload: { chatId: 'chat-1', sk: 'row-3', content: { input: {}, output: 'https://files.example/row-3?signature=abc' } },
      },
      {
        type: EventDocAiEffect.SetChatRowContent,
        payload: { chatId: 'chat-1', sk: 'row-1', content: { input: {}, output: 'https://files.example/row-1?signature=abc' } },
      },
    ]);
  });

  // The link reads the content for anyone who holds it.
  it('keeps every link out of the log', () => {
    const { redacted, downloaded } = runFill();

    expect(redacted).toEqual(downloaded);
    expect(redacted).toHaveLength(2);
  });

  it('logs and skips a content it cannot fetch, and still fetches the rest', () => {
    const { dispatched, logs } = runFill({ failing: ['row-3'] });

    expect(dispatched.map((effect) => effect.payload.sk)).toEqual(['row-1']);
    expect(logs).toEqual([expect.objectContaining({ logLevel: LogLevelEnum.Warn, msg: expect.stringMatching(/could not be loaded/) })]);
  });

  it('treats a download the storage refuses (an expired link) as a content it cannot fetch', () => {
    const { dispatched, logs } = runFill({ downloadStatus: 403 });

    expect(dispatched).toEqual([]);
    expect(logs).toHaveLength(2);
  });

  it('stops fetching once the person has opened another chat', () => {
    const { requested, dispatched } = runFill({ activeChatIds: ['chat-1', 'chat-2'] });

    expect(requested).toHaveLength(1);
    expect(dispatched).toHaveLength(1);
  });
});
