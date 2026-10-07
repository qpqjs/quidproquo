import type { AiCacheTtl, AiModel, AiToolDefinition } from 'quidproquo-core';

export type EventDocAiOptions = {
  // The eventDoc collection this AI works with (chats are scoped per document).
  storeName: string;
  type: string;
  // Chats and their history follow the collection's scope: set when the collection's
  // routes have a scopeResolver (the ws connection's scope), so the chat store and drive
  // refuse unscoped calls just like the collection's own.
  scoped?: boolean;
  // The service the ws requests route through — must match the serviceName the
  // frontend passes to askEventDocAiInit.
  serviceName: string;
  // The websocket events bus the chat queue subscribes to (app-specific).
  eventBusName: string;
  userDirectoryName: string;
  // Defaults to `${storeName}-ai`.
  aiName?: string;
  // Defaults to AiModel.ClaudeSonnet46.
  model?: AiModel;
  systemPrompt?: string;
  // A defineInlineFunction name invoked on every turn to build the system prompt
  // (receives EventDocAiSystemPromptInput, returns the prompt string). It must return
  // identical text every turn: the system prompt heads the cached prefix, and any
  // change rewrites the whole conversation to cache. Per-turn document state belongs
  // in `turnContextGenerator` or in tools. A non-empty result overrides
  // `systemPrompt`; an empty result falls back to it.
  systemPromptGenerator?: string;
  // A defineInlineFunction name invoked on every turn to build the turn context
  // (receives EventDocAiSystemPromptInput, returns a string). The text is sent as a
  // user message after the saved history, never persisted and never cached, so this
  // is where live document state goes. An empty result sends no context message.
  // should be "small" where possible
  turnContextGenerator?: string;
  // Tool executors are defineInlineFunction names registered by the caller.
  tools?: AiToolDefinition[];
  // Extended-thinking token budget. Defaults to 4096; pass 0 to disable
  // reasoning entirely. Thinking streams to the chat as reasoning segments so
  // the user sees progress instead of a silent wait.
  reasoningBudgetTokens?: number;
  // Output token cap per model call. Defaults to 65536 (the Claude Sonnet ceiling
  // on Bedrock; older or smaller models may reject it); the provider default
  // (8192) is too small for a reasoning block plus a large tool input, and a
  // call that hits it is cut off mid-JSON.
  maxOutputTokens?: number;
  // Requested lifetime of the prompt cache entries a turn writes. Defaults to
  // AiCacheTtl.Dynamic: on Bedrock an hour for the system prompt and the saved
  // history, so they outlive a user's pause between messages, and five minutes
  // for the tool loop, which is discarded when the turn ends.
  cacheTtl?: AiCacheTtl;
};
