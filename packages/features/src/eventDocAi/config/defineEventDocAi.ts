import {
  AiCacheTtl,
  AiModel,
  AiReasoningEffort,
  defineAi,
  defineKeyValueStore,
  defineQueue,
  defineStorageDrive,
  QPQConfig,
  QpqFunctionRuntimeAdvanced,
  QpqQueueProcessors,
} from '@qpqjs/core';
import { defineServiceFunction } from '@qpqjs/webserver';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../eventDoc';
import { buildEventDocStore, buildEventDocStoreGlobals } from '../../eventDoc';
import { eventDocAiChatBlobsDriveName } from '../constants/eventDocAiChatBlobsDriveName';
import { eventDocAiChatListStoreName } from '../constants/eventDocAiChatListStoreName';
import { eventDocAiChatRowsStoreName } from '../constants/eventDocAiChatRowsStoreName';
import { eventDocAiContinueFunctionName } from '../constants/eventDocAiContinueFunctionName';
import {
  EVENT_DOC_AI_CACHE_TTL_GLOBAL,
  EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL,
  EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL,
  EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL,
  EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL,
  EVENT_DOC_AI_MODEL_GLOBAL,
  EVENT_DOC_AI_NAME_GLOBAL,
  EVENT_DOC_AI_REASONING_EFFORT_GLOBAL,
  EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL,
  EVENT_DOC_AI_SERVICE_NAME_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL,
  EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL,
  EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL,
  EVENT_DOC_AI_USAGE_REPORT_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import { eventDocAiQueueName } from '../constants/eventDocAiQueueName';
import { eventDocAiRetiredChatDriveName } from '../constants/eventDocAiRetiredChatDriveName';
import { eventDocAiRetiredChatListStoreName } from '../constants/eventDocAiRetiredChatListStoreName';
import { buildEventDocAiMethodName } from '../logic';
import type { EventDocAiChatSummary } from '../models';
import {
  EVENT_DOC_AI_METHOD_CHAT_CREATE,
  EVENT_DOC_AI_METHOD_CHAT_HISTORY,
  EVENT_DOC_AI_METHOD_CHAT_LIST,
  EVENT_DOC_AI_METHOD_CHAT_ROW_CONTENT,
  EVENT_DOC_AI_METHOD_CHAT_SEND,
} from '../module';
import { EventDocAiOptions } from '../types/EventDocAiOptions';
import type { EventDocAiStoredChatRow } from '../types/EventDocAiStoredChatRow';
import { defineEventDocAiRegistration } from './defineEventDocAiRegistration';

// AI chats attached to an eventDoc collection, the AI sibling of defineEventDoc.
// Provisions a chat-list KVS, a chat-rows KVS (a chat's messages, one row per piece)
// and a drive for the row content too big for a row, registers the AI (tools are
// defineInlineFunction names supplied by the caller), subscribes a
// collection-scoped queue of websocket service-request handlers that ship
// inside this package (per-processor globals carry the wiring, exactly like
// defineEventDocRoutes' controllers), and a continuation service function a
// turn hands itself to when the runtime deadline is near.
export const defineEventDocAi = ({
  storeName,
  type,
  scoped = false,
  authorise,
  serviceName,
  eventBusName,
  userDirectoryName,
  aiName = `${storeName}-ai`,
  model = AiModel.ClaudeSonnet46,
  systemPrompt,
  systemPromptGenerator,
  turnContextGenerator,
  tools = [],
  reasoningEffort = AiReasoningEffort.Medium,
  maxOutputTokens = 65536,
  cacheTtl = AiCacheTtl.Dynamic,
  sendUsageToFrontend = false,
  usageReport,
}: EventDocAiOptions): QPQConfig => {
  const store = buildEventDocStore({ storeName, type, authorise });
  const chatBlobsDrive = eventDocAiChatBlobsDriveName(storeName);
  const chatListStore = eventDocAiChatListStoreName(storeName);
  const chatRowsStore = eventDocAiChatRowsStoreName(storeName);

  const globals: Record<string, unknown> = {
    // Full doc-store context so controllers (and future doc-aware helpers)
    // can use the generic eventDoc logic against the collection.
    ...buildEventDocStoreGlobals(store),
    [EVENT_DOC_USER_DIRECTORY_GLOBAL]: userDirectoryName,

    [EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL]: chatBlobsDrive,
    [EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL]: chatListStore,
    [EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL]: chatRowsStore,
    [EVENT_DOC_AI_SERVICE_NAME_GLOBAL]: serviceName,
    [EVENT_DOC_AI_NAME_GLOBAL]: aiName,
    [EVENT_DOC_AI_REASONING_EFFORT_GLOBAL]: reasoningEffort,
    [EVENT_DOC_AI_MAX_OUTPUT_TOKENS_GLOBAL]: maxOutputTokens,
    [EVENT_DOC_AI_MODEL_GLOBAL]: model,
    [EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL]: systemPrompt ?? '',
    [EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL]: systemPromptGenerator ?? '',
    [EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL]: turnContextGenerator ?? '',
    [EVENT_DOC_AI_CACHE_TTL_GLOBAL]: cacheTtl,
    [EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL]: sendUsageToFrontend,
    [EVENT_DOC_AI_USAGE_REPORT_GLOBAL]: usageReport ?? null,
  };

  const runtime = (entryType: string, functionName: string): QpqFunctionRuntimeAdvanced => ({
    basePath: __dirname,
    relativePath: `../entry/${entryType}/${functionName}`,
    functionName,
    globals,
  });

  const processorKey = (method: string): string => `qpq/serviceRequest/${serviceName}/${buildEventDocAiMethodName(type, method)}`;

  const processors: QpqQueueProcessors = {
    [processorKey(EVENT_DOC_AI_METHOD_CHAT_CREATE)]: runtime('queueEvent', 'onChatCreate'),
    [processorKey(EVENT_DOC_AI_METHOD_CHAT_LIST)]: runtime('queueEvent', 'onChatList'),
    [processorKey(EVENT_DOC_AI_METHOD_CHAT_HISTORY)]: runtime('queueEvent', 'onChatHistory'),
    [processorKey(EVENT_DOC_AI_METHOD_CHAT_SEND)]: runtime('queueEvent', 'onChatSend'),
    [processorKey(EVENT_DOC_AI_METHOD_CHAT_ROW_CONTENT)]: runtime('queueEvent', 'onChatRowContent'),
  };

  return [
    defineKeyValueStore<EventDocAiChatSummary>(chatListStore, 'docId', ['chatId'], { scoped }),
    // pk=docId#chatId, sk=a sortable row id, so a chat reads in the order its pieces were produced.
    defineKeyValueStore<EventDocAiStoredChatRow>(chatRowsStore, 'pk', ['sk'], { scoped }),
    defineStorageDrive(chatBlobsDrive, { scoped }),
    // TODO: @joe-coady: stop declaring these two once every deployment has taken a release that marks them
    // deleteOnRemove. They held each chat as one file and its list entry; nothing reads or writes them, and
    // dropping them deletes them.
    defineKeyValueStore<EventDocAiChatSummary>(eventDocAiRetiredChatListStoreName(storeName), 'docId', ['chatId'], { scoped, deleteOnRemove: true }),
    defineStorageDrive(eventDocAiRetiredChatDriveName(storeName), { scoped, deleteOnRemove: true }),
    defineAi(aiName, { tools }),
    defineEventDocAiRegistration({ aiName, serviceName, storeName, type, userDirectoryName }),
    defineQueue(eventDocAiQueueName(storeName), processors, {
      eventBusSubscriptions: [eventBusName],
      // One try only: every try of a chat step is another paid model call.
      maxTries: 1,
    }),
    defineServiceFunction(runtime('serviceFunction', 'eventDocAiChatContinue'), {
      functionName: eventDocAiContinueFunctionName(storeName),
    }),
  ];
};
