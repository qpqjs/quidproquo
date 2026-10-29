import {
  type AiCacheTtl,
  type AiModel,
  type AiReasoningEffort,
  askAiPromptStream,
  askConfigGetGlobal,
  AskResponse,
  AskResponseReturnType,
  type Nullable,
} from '@qpqjs/core';

import { askEventDocResolveScope, EVENT_DOC_STORAGE_DRIVE_GLOBAL } from '../../eventDoc';
import {
  EVENT_DOC_AI_CACHE_TTL_GLOBAL,
  EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL,
  EVENT_DOC_AI_MODEL_GLOBAL,
  EVENT_DOC_AI_NAME_GLOBAL,
  EVENT_DOC_AI_REASONING_EFFORT_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatMessage } from '../models';
import { chatMessagesToAiMessages } from '../module';
import { askEventDocAiSystemPromptResolve } from './askEventDocAiSystemPromptResolve';
import { askEventDocAiTurnContextResolve } from './askEventDocAiTurnContextResolve';

export type EventDocAiStreamHandle = AskResponseReturnType<ReturnType<typeof askAiPromptStream>>;

export type EventDocAiPromptStream = {
  streamHandle: EventDocAiStreamHandle;
  // The model the turn ran on, recorded on the saved reply.
  model: AiModel;
};

// Gathers everything one model call needs (the configured model and limits, the system
// prompt, the turn context, the history as model messages) and opens the stream.
export function* askEventDocAiPromptStreamOpen(
  docId: string,
  history: EventDocAiChatMessage[],
  isContinuation: boolean,
  maxDurationMs: number,
): AskResponse<EventDocAiPromptStream> {
  const aiName = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_NAME_GLOBAL);
  const model = yield* askConfigGetGlobal<AiModel>(EVENT_DOC_AI_MODEL_GLOBAL);
  const reasoningEffort = yield* askConfigGetGlobal<Nullable<AiReasoningEffort>>(EVENT_DOC_AI_REASONING_EFFORT_GLOBAL);
  const maxOutputTokens = yield* askConfigGetGlobal<number>(EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL);
  const cacheTtl = yield* askConfigGetGlobal<AiCacheTtl>(EVENT_DOC_AI_CACHE_TTL_GLOBAL);
  const systemPrompt = yield* askEventDocAiSystemPromptResolve(docId);
  const turnContext = yield* askEventDocAiTurnContextResolve(docId, isContinuation);

  // Attachments are doc assets, they live on the collection's storage drive
  // (uploaded via the eventDoc asset routes), not the chat-history drive.
  const docStorageDrive = yield* askConfigGetGlobal<string>(EVENT_DOC_STORAGE_DRIVE_GLOBAL);

  // The collection's ambient storage scope (e.g. a tenant/personal partition set
  // on the ws connection). A scoped collection stores its assets under it, so the
  // model's attachment reads must apply the same scope, undefined for unscoped
  // collections. Read here, tenant-agnostic, exactly as chat-history storage reads it.
  const scope = yield* askEventDocResolveScope();

  const aiMessages = chatMessagesToAiMessages(history, docStorageDrive, docId, scope);

  // Tools do NOT receive the docId from the model, executors inherit the
  // session context (provided around the handler) and read the trusted id there.
  const streamHandle = yield* askAiPromptStream(model, '', {
    system: systemPrompt,
    aiName,
    messages: aiMessages,
    turnContext,
    reasoning: reasoningEffort ? { effort: reasoningEffort } : undefined,
    caching: true,
    cacheTtl: cacheTtl || undefined,
    maxOutputTokens,
    maxDurationMs,
  });

  return { streamHandle, model };
}
