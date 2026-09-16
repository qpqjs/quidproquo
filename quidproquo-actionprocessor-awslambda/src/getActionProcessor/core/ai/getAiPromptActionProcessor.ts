import {
  actionResult,
  actionResultError,
  AiActionType,
  askAiPrompt,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { generateText } from 'ai';

import { buildAiStopConditions, createDriveFileResolver, prepareAiPromptCall, toCacheableMessages, toCacheableSystem, toSdkMessages } from './logic';

const getProcessAiPrompt = (qpqConfig: QPQConfig): ProcessorFor<typeof askAiPrompt> => {
  return async (payload, session, actionProcessorList, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const prepared = prepareAiPromptCall(qpqConfig, payload, session, actionProcessorList, logger, dynamicModuleLoader, streamRegistry);
    if ('error' in prepared) {
      return actionResultError(prepared.error.type, prepared.error.message);
    }

    try {
      const promptOrMessages = payload.messages
        ? {
            messages: toCacheableMessages(
              await toSdkMessages(
                payload.messages,
                createDriveFileResolver(qpqConfig, session, actionProcessorList, logger, dynamicModuleLoader, streamRegistry),
              ),
              payload.caching,
            ),
          }
        : { prompt: payload.prompt };

      // Extended thinking: the model reasons before answering, within the token budget.
      const providerOptions = payload.reasoning
        ? { bedrock: { reasoningConfig: { type: 'enabled' as const, budgetTokens: payload.reasoning.budgetTokens ?? 4096 } } }
        : undefined;

      const result = await generateText({
        model: prepared.model,
        system: toCacheableSystem(payload.system, payload.caching),
        ...promptOrMessages,
        tools: prepared.tools,
        providerOptions,
        stopWhen: buildAiStopConditions(payload),
        maxOutputTokens: payload.maxOutputTokens,
      });

      if (payload.caching) {
        // The SDK's cross-provider usage breakdown, not providerMetadata.bedrock.usage; that
        // field never carries cacheReadInputTokens through on @ai-sdk/amazon-bedrock (5.0.11).
        console.log('AI prompt cache usage:', result.finalStep?.usage?.inputTokenDetails);
      }

      return actionResult({ text: result.text });
    } catch (error) {
      if (error instanceof Error) {
        return actionResultError(ErrorTypeEnum.GenericError, error.message);
      }

      return actionResultError(ErrorTypeEnum.GenericError, 'An error occurred during AI prompt execution.');
    }
  };
};

export const getAiPromptActionProcessor = createActionProcessor(askAiPrompt, getProcessAiPrompt);
