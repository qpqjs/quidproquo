import {
  AiActionType,
  AiCacheTtl,
  AiModel,
  AiStreamFinishReasonEnum,
  AiStreamPartType,
  ConfigActionType,
  FileActionType,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  runStory,
  StateActionType,
  StreamActionType,
  SystemActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_STORAGE_DRIVE_GLOBAL } from '../../eventDoc';
import { EVENT_DOC_AI_CONTINUATION_NUDGE } from '../constants/eventDocAiContinuationNudge';
import {
  EVENT_DOC_AI_CACHE_TTL_GLOBAL,
  EVENT_DOC_AI_CHAT_DRIVE_GLOBAL,
  EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL,
  EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL,
  EVENT_DOC_AI_MODEL_GLOBAL,
  EVENT_DOC_AI_NAME_GLOBAL,
  EVENT_DOC_AI_REASONING_BUDGET_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL,
  EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatMessage } from '../models';
import { askEventDocAiStreamTurn } from './askEventDocAiStreamTurn';

const globals: Record<string, unknown> = {
  [EVENT_DOC_AI_NAME_GLOBAL]: 'docs-ai',
  [EVENT_DOC_AI_MODEL_GLOBAL]: AiModel.ClaudeSonnet46,
  [EVENT_DOC_AI_REASONING_BUDGET_GLOBAL]: 0,
  [EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL]: 65536,
  [EVENT_DOC_AI_CACHE_TTL_GLOBAL]: AiCacheTtl.OneHour,
  [EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL]: 'You are the docs assistant.',
  [EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL]: '',
  [EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL]: 'buildContext',
  [EVENT_DOC_AI_CHAT_DRIVE_GLOBAL]: 'chat-drive',
  [EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL]: 'chat-list',
  [EVENT_DOC_STORAGE_DRIVE_GLOBAL]: 'doc-assets',
};

const history: EventDocAiChatMessage[] = [
  { role: 'user', segments: [{ type: 'text', text: 'What is in the document?' }] },
  { role: 'assistant', segments: [{ type: 'text', text: 'A heading and two paragraphs.' }] },
  { role: 'user', segments: [{ type: 'text', text: 'Add a third paragraph.' }] },
];

// Drives one turn to completion: the model streams a single text reply, then the
// history save and chat touch run. Captures what the prompt and the save received.
const runTurn = (isContinuation: boolean) => {
  const chunks = [
    { data: JSON.stringify({ type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Done.' }) },
    { data: JSON.stringify({ type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage: {} }) },
    { done: true },
  ];
  let promptPayload: Record<string, unknown> | undefined;
  let savedFile: { messages: EventDocAiChatMessage[] } | undefined;

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
    [StateActionType.Dispatch]: undefined,
    [FileActionType.WriteObjectJson]: (action: { payload: { data: { messages: EventDocAiChatMessage[] } } }) => {
      savedFile = action.payload.data;
    },
    [KeyValueStoreActionType.Query]: { items: [] },
  });

  return { result, promptPayload, savedFile };
};

describe('askEventDocAiStreamTurn', () => {
  it('sends the saved history as messages and the generated context as turn context, never mixing them', () => {
    const { result, promptPayload } = runTurn(false);

    expect(result).toEqual({ complete: true });
    expect(promptPayload).toEqual(
      expect.objectContaining({
        model: AiModel.ClaudeSonnet46,
        system: 'You are the docs assistant.',
        aiName: 'docs-ai',
        caching: true,
        cacheTtl: AiCacheTtl.OneHour,
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
    const { promptPayload } = runTurn(true);

    expect(promptPayload?.turnContext).toEqual([
      { role: 'user', content: 'Document is at version 3.' },
      { role: 'user', content: EVENT_DOC_AI_CONTINUATION_NUDGE },
    ]);
    expect(promptPayload?.messages).toHaveLength(history.length);
  });

  it('saves the history plus the reply, without the turn context', () => {
    const { savedFile } = runTurn(true);

    expect(savedFile).toEqual({
      messages: [...history, { role: 'assistant', segments: [{ type: 'text', text: 'Done.' }] }],
    });
  });
});
