import { AskResponse, askStorageScopeProvide, ConfigActionType, InlineFunctionActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AI_CHAT_NAME_MAX_LENGTH } from '../constants/eventDocAiChatNameMaxLength';
import { EVENT_DOC_AI_CHAT_NAME_PROMPT } from '../constants/eventDocAiChatNamePrompt';
import {
  EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import { askEventDocAiProvide, askEventDocAiRead } from '../context';
import { qpqEventDocAiSetChatName } from '../entry/inlineFunction/qpqEventDocAiSetChatName';
import type { EventDocAiChatSummary } from '../models';
import { askEventDocAiProvideChat } from './askEventDocAiProvideChat';
import { askEventDocAiSystemPromptResolve } from './askEventDocAiSystemPromptResolve';
import { normaliseEventDocAiChatName } from './normaliseEventDocAiChatName';

const chat: EventDocAiChatSummary = {
  docId: 'doc-1',
  chatId: 'chat-1',
  name: 'New chat',
  createdAt: '2026-11-24T00:00:00.000Z',
  updatedAt: '2026-11-24T00:00:00.000Z',
  createdByUserId: 'user-1',
};

// A stand-in chat list holding one chat of one document, in one tenant.
const createChatList = () => {
  const lookups: { docId: unknown; chatId: unknown; scope?: string }[] = [];
  const saved: { chat: EventDocAiChatSummary; scope?: string }[] = [];

  const mocks = {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
      action.payload.globalName === EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL ? 'chat-list' : '',
    [KeyValueStoreActionType.Query]: (action: { payload: { keyCondition: { conditions: { valueA: unknown }[] }; options?: { scope?: string } } }) => {
      const [docId, chatId] = action.payload.keyCondition.conditions.map((condition) => condition.valueA);
      lookups.push({ docId, chatId, scope: action.payload.options?.scope });
      return { items: docId === chat.docId && chatId === chat.chatId && action.payload.options?.scope === 'tenant-a' ? [chat] : [] };
    },
    [KeyValueStoreActionType.Upsert]: (action: { payload: { item: EventDocAiChatSummary; options?: { scope?: string } } }) => {
      saved.push({ chat: action.payload.item, scope: action.payload.options?.scope });
    },
  };

  // Runs the tool as a turn would: inside the tenant, with the document and chat on the trusted context.
  const callTool = (payload: { name?: unknown }, context: { docId: string; chatId?: string }, scope = 'tenant-a') =>
    runStory(
      askStorageScopeProvide(scope, askEventDocAiProvide({ serviceName: 'svc', type: 'doc', ...context }, qpqEventDocAiSetChatName(payload))),
      mocks,
    );

  return { callTool, lookups, saved };
};

describe('the setChatName tool', () => {
  // The answer goes to the model and shows in the chat, so it says it worked and nothing more: no ids, no user.
  it('names the chat the turn is running for and answers only that it worked', () => {
    const { callTool, saved } = createChatList();

    const result = callTool({ name: 'Guarantor clause wording' }, { docId: 'doc-1', chatId: 'chat-1' });

    expect(result).toEqual({ ok: true });
    expect(saved).toEqual([{ chat: { ...chat, name: 'Guarantor clause wording' }, scope: 'tenant-a' }]);
  });

  // Security regression: which chat is renamed comes from the context the turn provides. Whatever the model
  // passes besides the name is ignored, so it cannot be talked into renaming another chat or document's chat.
  it('ignores a chat or document the model passes and renames only the chat on the context', () => {
    const { callTool, lookups, saved } = createChatList();

    callTool({ name: 'Renamed', chatId: 'chat-2', docId: 'doc-2' } as { name: string }, { docId: 'doc-1', chatId: 'chat-1' });

    expect(lookups).toEqual([{ docId: 'doc-1', chatId: 'chat-1', scope: 'tenant-a' }]);
    expect(saved.map(({ chat: renamed }) => [renamed.docId, renamed.chatId])).toEqual([['doc-1', 'chat-1']]);
  });

  it('refuses when no turn is running, so there is no chat to name', () => {
    const { callTool, saved } = createChatList();

    expect(() => callTool({ name: 'Renamed' }, { docId: 'doc-1' })).toThrow(/no chat to name/);
    expect(saved).toEqual([]);
  });

  it('refuses a chat the document does not have, and a chat in another tenant', () => {
    const { callTool, saved } = createChatList();

    expect(() => callTool({ name: 'Renamed' }, { docId: 'doc-2', chatId: 'chat-1' })).toThrow(/no longer exists/);
    expect(() => callTool({ name: 'Renamed' }, { docId: 'doc-1', chatId: 'chat-1' }, 'tenant-b')).toThrow(/no longer exists/);
    expect(saved).toEqual([]);
  });

  it('refuses a name with nothing usable in it', () => {
    const { callTool, saved } = createChatList();

    expect(() => callTool({ name: '   \n ' }, { docId: 'doc-1', chatId: 'chat-1' })).toThrow(/at least one character/);
    expect(() => callTool({ name: { not: 'text' } }, { docId: 'doc-1', chatId: 'chat-1' })).toThrow(/at least one character/);
    expect(() => callTool({}, { docId: 'doc-1', chatId: 'chat-1' })).toThrow(/at least one character/);
    expect(saved).toEqual([]);
  });
});

// The name is written by the model, which reads document content, so nothing about it is trusted.
describe('normaliseEventDocAiChatName', () => {
  it('keeps an ordinary name as it is', () => {
    expect(normaliseEventDocAiChatName('Guarantor clause wording')).toBe('Guarantor clause wording');
  });

  it('makes it one trimmed line', () => {
    expect(normaliseEventDocAiChatName('  Guarantor\n\nclause\t wording  ')).toBe('Guarantor clause wording');
  });

  it('cuts it to the longest a name may be', () => {
    const name = normaliseEventDocAiChatName(`${'word '.repeat(40)}`);

    expect(name.length).toBeLessThanOrEqual(EVENT_DOC_AI_CHAT_NAME_MAX_LENGTH);
    expect(name).toBe(name.trim());
  });

  it('is empty for anything that is not text', () => {
    expect([normaliseEventDocAiChatName(undefined), normaliseEventDocAiChatName(42), normaliseEventDocAiChatName(null)]).toEqual(['', '', '']);
  });
});

describe('askEventDocAiProvideChat', () => {
  it('adds the chat to the context a turn runs in, and keeps the document it already had', () => {
    const readInTurn: AskResponse<unknown> = askEventDocAiProvide(
      { serviceName: 'svc', type: 'doc', docId: 'doc-1' },
      askEventDocAiProvideChat('chat-1', askEventDocAiRead()),
    );

    expect(runStory(readInTurn)).toEqual({ serviceName: 'svc', type: 'doc', docId: 'doc-1', chatId: 'chat-1' });
  });

  it('leaves no chat on the context outside a turn', () => {
    expect(runStory(askEventDocAiProvide({ serviceName: 'svc', type: 'doc', docId: 'doc-1' }, askEventDocAiRead()))).not.toHaveProperty('chatId');
  });
});

describe('the system prompt and chat naming', () => {
  const resolve = (globals: Record<string, unknown>) =>
    runStory(askEventDocAiSystemPromptResolve('doc-1'), {
      [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',
      [InlineFunctionActionType.Execute]: 'Generated prompt.',
    });

  it('adds the naming paragraph after the configured prompt', () => {
    expect(resolve({ [EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL]: 'You are the docs assistant.' })).toBe(
      `You are the docs assistant.\n\n${EVENT_DOC_AI_CHAT_NAME_PROMPT}`,
    );
  });

  it('adds it after a generated prompt and after the default one too', () => {
    const generated = resolve({ [EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL]: 'buildPrompt' });
    const fallback = resolve({});

    expect(generated).toBe(`Generated prompt.\n\n${EVENT_DOC_AI_CHAT_NAME_PROMPT}`);
    expect(fallback.endsWith(`\n\n${EVENT_DOC_AI_CHAT_NAME_PROMPT}`)).toBe(true);
    expect(fallback.length).toBeGreaterThan(EVENT_DOC_AI_CHAT_NAME_PROMPT.length + 2);
  });

  // The prompt heads the cached prefix, so it must be the same text every turn.
  it('is the same text every turn', () => {
    const globals = { [EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL]: 'You are the docs assistant.' };

    expect(resolve(globals)).toBe(resolve(globals));
  });
});
