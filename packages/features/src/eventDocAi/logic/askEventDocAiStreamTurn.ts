import {
  type AiCacheTtl,
  type AiModel,
  type AiReasoningEffort,
  type AiStreamFinish,
  AiStreamFinishReasonEnum,
  type AiStreamPart,
  AiStreamPartType,
  askAiPromptStream,
  askConfigGetGlobal,
  askGetRuntimeRemainingTime,
  askInlineFunctionExecute,
  AskResponse,
  askStreamMap,
  type Nullable,
} from 'quidproquo-core';

import { askEventDocResolveScope, EVENT_DOC_STORAGE_DRIVE_GLOBAL } from '../../eventDoc';
import type { ServiceRequestDeferred } from '../../webSocketQueue/logic/service';
import {
  EVENT_DOC_AI_CACHE_TTL_GLOBAL,
  EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL,
  EVENT_DOC_AI_MODEL_GLOBAL,
  EVENT_DOC_AI_NAME_GLOBAL,
  EVENT_DOC_AI_REASONING_EFFORT_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import { askEventDocAiChatHistorySave } from '../data/askEventDocAiChatHistorySave';
import { askEventDocAiChatTouch } from '../data/askEventDocAiChatTouch';
import type { EventDocAiChatMessage, EventDocAiChatSendResult, EventDocAiMessageSegment, EventDocAiSystemPromptInput } from '../models';
import {
  askUIEventDocAiAppendChatMessage,
  askUIEventDocAiAppendStreamChunk,
  askUIEventDocAiClearStream,
  chatMessagesToAiMessages,
  mergeStreamParts,
} from '../module';
import { askEventDocAiContinueHandoff } from './askEventDocAiContinueHandoff';
import { askEventDocAiTurnContextResolve } from './askEventDocAiTurnContextResolve';
import { askEventDocAiUsageVisible } from './askEventDocAiUsageVisible';
import { getEventDocAiStreamUsage } from './getEventDocAiStreamUsage';
import { redactAiStreamPartUsage } from './redactAiStreamPartUsage';
import { redactEventDocAiChatMessageUsage } from './redactEventDocAiChatMessageUsage';
import { withEventDocAiStopNotice } from './withEventDocAiStopNotice';

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant. Use tools when appropriate.';

// Wall-clock kept back from the runtime deadline. The stream's stop condition only
// runs between steps, so one more model call plus the history save must fit inside
// this; running out mid-save loses the reply.
const HANDOFF_HEADROOM_MS = 90_000;

// A step cut off by the output token cap leaves a truncated tool call (saved
// with its error output). Resuming lets the model retry with a smaller call, but
// one that keeps overrunning the cap is stopped after this many resumes.
const MAX_LENGTH_RESUMES = 3;

// The Finish part's reason says how the underlying AI SDK loop ended: `stop`
// means the model finished its answer; `toolCalls` means a stop condition cut
// it off while it still wanted to keep acting; `length` means the output token
// cap cut it off. Both of the latter can be resumed from the saved history.
const getFinishPart = (parts: AiStreamPart[]): AiStreamFinish | undefined =>
  parts.find((part): part is AiStreamFinish => part.type === AiStreamPartType.Finish);

// A tool call with no output after the stream has ended is a client-side tool
// (a config tool with no executor): nothing server-side can resolve it, so the
// turn must be handed to the client instead of resumed.
const segmentHasPendingToolUse = (segment: EventDocAiMessageSegment): boolean =>
  segment.type === 'tool-use' && segment.tools.some((tool) => tool.output === undefined);

// The turn's system prompt: the configured generator inline function, else the
// static configured prompt, else the default. It heads the cached prefix, so it
// must come back identical every turn; per-turn document state travels in the
// turn context instead. Never persisted: the chat history stores messages only.
function* askEventDocAiSystemPromptResolve(docId: string): AskResponse<string> {
  const generatorFn = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL);

  const generatedPrompt = generatorFn ? yield* askInlineFunctionExecute<string, EventDocAiSystemPromptInput>(generatorFn, { docId }) : '';

  const configuredPrompt = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL);

  return generatedPrompt || configuredPrompt || DEFAULT_SYSTEM_PROMPT;
}

export type EventDocAiStreamTurnOptions = {
  // Adds the continuation nudge to the turn context so a resumed history ends on a user turn.
  isContinuation: boolean;
  // Consecutive resumes caused by the output token cap so far.
  lengthResumes: number;
};

/**
 * Streams one model reply for an already-saved history and folds it in. Stream
 * parts are transport-only: each is dispatched to the UI as it arrives, then the
 * completed reply is saved as durable segments and dispatched as the finalized
 * message. Hands the turn to a continuation execution (and returns deferred)
 * whenever the runtime deadline gets in the way, before or after streaming.
 */
export function* askEventDocAiStreamTurn(
  docId: string,
  chatId: string,
  history: EventDocAiChatMessage[],
  { isContinuation, lengthResumes }: EventDocAiStreamTurnOptions,
): AskResponse<EventDocAiChatSendResult | ServiceRequestDeferred> {
  const budgetMs = (yield* askGetRuntimeRemainingTime()) - HANDOFF_HEADROOM_MS;

  if (budgetMs <= 0) {
    return yield* askEventDocAiContinueHandoff(chatId, lengthResumes);
  }

  const aiName = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_NAME_GLOBAL);
  const model = yield* askConfigGetGlobal<AiModel>(EVENT_DOC_AI_MODEL_GLOBAL);
  const reasoningEffort = yield* askConfigGetGlobal<Nullable<AiReasoningEffort>>(EVENT_DOC_AI_REASONING_EFFORT_GLOBAL);
  const maxOutputTokens = yield* askConfigGetGlobal<number>(EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL);
  const cacheTtl = yield* askConfigGetGlobal<AiCacheTtl>(EVENT_DOC_AI_CACHE_TTL_GLOBAL);
  const systemPrompt = yield* askEventDocAiSystemPromptResolve(docId);
  const turnContext = yield* askEventDocAiTurnContextResolve(docId, isContinuation);
  const usageVisible = yield* askEventDocAiUsageVisible();

  // Attachments are doc assets — they live on the collection's storage drive
  // (uploaded via the eventDoc asset routes), not the chat-history drive.
  const docStorageDrive = yield* askConfigGetGlobal<string>(EVENT_DOC_STORAGE_DRIVE_GLOBAL);

  // The collection's ambient storage scope (e.g. a tenant/personal partition set
  // on the ws connection). A scoped collection stores its assets under it, so the
  // model's attachment reads must apply the same scope — undefined for unscoped
  // collections. Read here, tenant-agnostic, exactly as chat-history storage reads it.
  const scope = yield* askEventDocResolveScope();

  const aiMessages = chatMessagesToAiMessages(history, docStorageDrive, docId, scope);

  // Tools do NOT receive the docId from the model — executors inherit the
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
    maxDurationMs: budgetMs,
  });

  const assistantParts = yield* askStreamMap(streamHandle, function* askMap(part) {
    // Tool argument fragments are not forwarded: a large tool input arrives as
    // hundreds of deltas, and the UI only needs to know a call has started
    // (ToolInputStart) and what it was (ToolCall). They are still collected so
    // the saved message folds the same way.
    if (part.type !== AiStreamPartType.ToolInputDelta) {
      yield* askUIEventDocAiAppendStreamChunk(usageVisible ? part : redactAiStreamPartUsage(part));
    }

    return part;
  });

  const finishPart = getFinishPart(assistantParts);

  // Fold the transport parts into durable segments. A turn that failed, was
  // declined, or ended without an answer for a reason this version cannot name
  // saves a notice saying so, so the person is never left with silence.
  const segments = withEventDocAiStopNotice(mergeStreamParts(assistantParts), assistantParts);

  if (segments.length > 0) {
    // Usage is saved whatever the visibility setting says; the setting only decides what the
    // browser is shown.
    const usage = getEventDocAiStreamUsage(assistantParts);
    const assistantMessage: EventDocAiChatMessage = {
      role: 'assistant',
      segments,
      model,
      ...(usage ? { usage } : {}),
    };

    yield* askEventDocAiChatHistorySave(docId, chatId, [...history, assistantMessage]);

    yield* askUIEventDocAiAppendChatMessage(usageVisible ? assistantMessage : redactEventDocAiChatMessageUsage(assistantMessage));
  }

  yield* askUIEventDocAiClearStream();

  yield* askEventDocAiChatTouch(docId, chatId);

  // A pending client tool (saved in the history; the client renders it, e.g.
  // as a form) resumes when the answer arrives as the next chat message.
  if (segments.some(segmentHasPendingToolUse)) {
    // TODO: Send the tool call frontend request to the frontend via websocket, on this corrolation.
    // the toolcall can be completed and send as a message back to the chat here, on another lambda invoke.

    return { complete: false };
  }

  const finishReason = finishPart?.finishReason;

  // 'tool-calls' means the time budget cut the model off mid-work; 'length'
  // means the output cap did. Only a reply that made progress is worth
  // resuming; an empty one would just be cut off again.
  const cutOffByTime = finishReason === AiStreamFinishReasonEnum.toolCalls;
  const cutOffByLength = finishReason === AiStreamFinishReasonEnum.length;

  if (segments.length > 0) {
    if (cutOffByTime) {
      return yield* askEventDocAiContinueHandoff(chatId, 0);
    }

    if (cutOffByLength && lengthResumes < MAX_LENGTH_RESUMES) {
      return yield* askEventDocAiContinueHandoff(chatId, lengthResumes + 1);
    }
  }

  return { complete: !cutOffByTime && !cutOffByLength };
}
