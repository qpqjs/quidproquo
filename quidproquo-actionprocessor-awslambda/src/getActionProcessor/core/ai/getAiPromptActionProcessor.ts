import { actionResult, actionResultError, askAiPrompt, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { generateText } from 'ai';

import {
  buildAiPromptInput,
  buildAiStopConditions,
  createCachePrepareStep,
  createDriveFileResolver,
  logAiCacheUsage,
  prepareAiPromptCall,
  toAiStreamUsage,
  toBedrockReasoningOptions,
  toCacheableSystem,
} from './logic';
import { BedrockCacheSettings } from './types';

const getProcessAiPrompt = (qpqConfig: QPQConfig): ProcessorFor<typeof askAiPrompt> => {
  return async (payload, session, actionProcessorList, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const prepared = prepareAiPromptCall(qpqConfig, payload, session, actionProcessorList, logger, dynamicModuleLoader, streamRegistry);
    if ('error' in prepared) {
      return actionResultError(prepared.error.type, prepared.error.message);
    }

    try {
      const input = await buildAiPromptInput(
        payload,
        createDriveFileResolver(qpqConfig, session, actionProcessorList, logger, dynamicModuleLoader, streamRegistry),
      );

      const cache: BedrockCacheSettings = { model: payload.model, cacheTtl: payload.cacheTtl };

      const providerOptions = toBedrockReasoningOptions(payload.model, payload.reasoning);

      const result = await generateText({
        model: prepared.model,
        system: toCacheableSystem(payload.system, payload.caching, cache),
        ...input.promptOrMessages,
        tools: prepared.tools,
        providerOptions,
        stopWhen: buildAiStopConditions(payload),
        maxOutputTokens: payload.maxOutputTokens,
        prepareStep: payload.caching ? createCachePrepareStep({ ...cache, durableCount: input.durableCount }) : undefined,
      });

      const usage = toAiStreamUsage(result.usage);

      if (payload.caching) {
        logAiCacheUsage(usage);
      }

      return actionResult({ text: result.text, usage });
    } catch (error) {
      if (error instanceof Error) {
        return actionResultError(ErrorTypeEnum.GenericError, error.message);
      }

      return actionResultError(ErrorTypeEnum.GenericError, 'An error occurred during AI prompt execution.');
    }
  };
};

export const getAiPromptActionProcessor = createActionProcessor(askAiPrompt, getProcessAiPrompt);
