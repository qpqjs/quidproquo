import { StateActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ServiceActionType } from '../../webSocketQueue/actions/ServiceActionType';
import type { EventDocAiChatHistoryResult, EventDocAiChatRow } from '../models';
import { EventDocAiChatRowDataType } from '../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import { EventDocAiLoadChatRowsMode } from '../models/EventDocAiLoadChatRowsMode';
import { EventDocAiEffect } from '../module/effects/EventDocAiEffect';
import { askEventDocAiLoadChatRows } from './askEventDocAiLoadChatRows';

type Dispatched = { type: EventDocAiEffect; payload: { chatId: string; rows: EventDocAiChatRow[] } };

const row = (sk: string): EventDocAiChatRow => ({
  sk,
  messageId: sk,
  role: 'assistant',
  kind: EventDocAiChatRowKind.Text,
  data: { type: EventDocAiChatRowDataType.Inline, content: sk },
});

// The chat as the server pages it: newest page first, each page oldest first.
const newestPage: EventDocAiChatHistoryResult = { rows: [row('row-5'), row('row-6')], hasMore: true };
const middlePage: EventDocAiChatHistoryResult = { rows: [row('row-3'), row('row-4')], hasMore: true };
const oldestPage: EventDocAiChatHistoryResult = { rows: [row('row-1'), row('row-2')], hasMore: false };

const pagesByBefore: Record<string, EventDocAiChatHistoryResult> = { newest: newestPage, 'row-5': middlePage, 'row-3': oldestPage };

type LoadOptions = {
  mode?: EventDocAiLoadChatRowsMode;
  /** The chat the state says is open after each page arrives, in order; the last one repeats. */
  activeChatIds?: string[];
  pages?: Record<string, EventDocAiChatHistoryResult>;
};

const runLoad = ({ mode = EventDocAiLoadChatRowsMode.ShowEachPage, activeChatIds = ['chat-1'], pages = pagesByBefore }: LoadOptions = {}) => {
  const dispatched: Dispatched[] = [];
  const requested: (string | undefined)[] = [];
  let reads = 0;

  const result = runStory(askEventDocAiLoadChatRows('chat-1', mode), {
    [StateActionType.Read]: () => ({ activeChatId: activeChatIds[Math.min(reads++, activeChatIds.length - 1)] }),
    [StateActionType.Dispatch]: (action: { payload: { action: Dispatched } }) => {
      dispatched.push(action.payload.action);
      return undefined;
    },
    [ServiceActionType.Request]: (action: { payload: { payload: { chatId: string; before?: string } } }) => {
      requested.push(action.payload.payload.before);
      return pages[action.payload.payload.before ?? 'newest'];
    },
  });

  return { result, dispatched, requested };
};

describe('askEventDocAiLoadChatRows', () => {
  it('asks for the newest page, then for the page before the oldest row it has, until nothing older is left', () => {
    const { result, requested } = runLoad();

    expect(requested).toEqual([undefined, 'row-5', 'row-3']);
    expect(result?.map((loaded) => loaded.sk)).toEqual(['row-1', 'row-2', 'row-3', 'row-4', 'row-5', 'row-6']);
  });

  it('shows each page as it arrives when opening a chat, newest first', () => {
    const { dispatched } = runLoad({ mode: EventDocAiLoadChatRowsMode.ShowEachPage });

    expect(dispatched.map((effect) => [effect.type, effect.payload.chatId, effect.payload.rows.map((loaded) => loaded.sk)])).toEqual([
      [EventDocAiEffect.PrependChatRows, 'chat-1', ['row-5', 'row-6']],
      [EventDocAiEffect.PrependChatRows, 'chat-1', ['row-3', 'row-4']],
      [EventDocAiEffect.PrependChatRows, 'chat-1', ['row-1', 'row-2']],
    ]);
  });

  it('changes nothing until every page is in when reloading, then replaces the rows once', () => {
    const { dispatched } = runLoad({ mode: EventDocAiLoadChatRowsMode.ReplaceWhenLoaded });

    expect(dispatched.map((effect) => [effect.type, effect.payload.rows.map((loaded) => loaded.sk)])).toEqual([
      [EventDocAiEffect.SetChatRows, ['row-1', 'row-2', 'row-3', 'row-4', 'row-5', 'row-6']],
    ]);
  });

  // The pages of one chat must never land in another.
  it('stops, shows nothing more and returns null once the person has opened another chat', () => {
    const { result, dispatched, requested } = runLoad({ activeChatIds: ['chat-1', 'chat-2'] });

    expect(result).toBeNull();
    expect(requested).toEqual([undefined, 'row-5']);
    expect(dispatched.map((effect) => effect.payload.rows.map((loaded) => loaded.sk))).toEqual([['row-5', 'row-6']]);
  });

  it('loads an empty chat in one request', () => {
    const { result, requested } = runLoad({ pages: { newest: { rows: [], hasMore: false } } });

    expect(requested).toEqual([undefined]);
    expect(result).toEqual([]);
  });

  // A page that says there is more but holds no rows gives nowhere to continue from; looping on it would never end.
  it('ends the load on a page with no rows, whatever that page claims', () => {
    const { requested } = runLoad({ pages: { newest: { rows: [], hasMore: true } } });

    expect(requested).toEqual([undefined]);
  });
});
