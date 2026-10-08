import {
  AiActionType,
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
} from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatMessage } from '../models';
import { EventDocAiEffect } from '../module/effects/EventDocAiEffect';
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
  /** The parts the model streams back; defaults to one text reply that ends normally. */
  parts?: Record<string, unknown>[];
};

// Drives one turn to completion: the model streams a single text reply, then the
// history save and chat touch run. Captures what the prompt, the save and the browser received.
const defaultParts: Record<string, unknown>[] = [
  { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Done.' },
  { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage },
];

const runTurn = ({ isContinuation = false, sendUsageToFrontend, parts = defaultParts }: TurnOptions = {}) => {
  const globals: Record<string, unknown> = { ...baseGlobals, [EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL]: sendUsageToFrontend };
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
  });

  const streamedFinish = dispatched.find(
    (effect) => effect.type === EventDocAiEffect.AppendStreamChunk && (effect.payload.part as { type: string }).type === AiStreamPartType.Finish,
  )?.payload.part as { usage: unknown } | undefined;
  const appendedMessage = dispatched.find((effect) => effect.type === EventDocAiEffect.AppendChatMessage)?.payload.message as
    EventDocAiChatMessage | undefined;

  return { result, promptPayload, savedFile, streamedFinish, appendedMessage };
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

  it('lets usage through to the browser when the chat asks for it', () => {
    const { streamedFinish, appendedMessage } = runTurn({ sendUsageToFrontend: true });

    expect(streamedFinish?.usage).toEqual(usage);
    expect(appendedMessage).toEqual(savedReply);
  });
});
