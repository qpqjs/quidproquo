import { AiActionType } from 'quidproquo-core';

const coreAiActionComponentMap: Record<string, string[]> = {
  [AiActionType.Prompt]: ['askAiPrompt', 'model', 'prompt', 'messages', 'turnContext', 'system', 'aiName'],
  [AiActionType.PromptStream]: ['askAiPromptStream', 'model', 'prompt', 'messages', 'turnContext', 'system', 'aiName'],
};

export default coreAiActionComponentMap;
