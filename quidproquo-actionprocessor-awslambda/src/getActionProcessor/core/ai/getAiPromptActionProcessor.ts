import {
  actionResult,
  actionResultError,
  askAiPrompt,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  sumAiStreamUsage,
} from 'quidproquo-core';

import type { LanguageModelUsage, ModelMessage } from 'ai';
import { generateText, jsonSchema, NoObjectGeneratedError, Output } from 'ai';

import {
  AiOutputObjectGenerate,
  AiOutputObjectReply,
  buildAiPromptInput,
  buildAiStopConditions,
  createCachePrepareStep,
  createDriveFileResolver,
  generateAiOutputObject,
  logAiCacheUsage,
  prepareAiPromptCall,
  toAiStreamUsage,
  toBedrockReasoningOptions,
  toCacheableSystem,
} from './logic';
import { BedrockCacheSettings } from './types';

// One schema-shaped call. A reply the SDK cannot parse at all (prose, or JSON cut off at the token
// limit) throws NoObjectGeneratedError from inside generateText; it comes back as a reply with no
// output, so the repair loop shows the model its raw text instead of giving up, and its usage counts.
const generateOutputObjectReply = async (
  call: () => Promise<{ text: string; output: unknown; usage: LanguageModelUsage }>,
): Promise<AiOutputObjectReply> => {
  try {
    const result = await call();
    return { text: result.text, output: result.output, usage: toAiStreamUsage(result.usage) };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return { text: error.text ?? '', output: undefined, usage: error.usage ? toAiStreamUsage(error.usage) : {} };
    }
    throw error;
  }
};

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

      const reasoningOptions = toBedrockReasoningOptions(payload.model, payload.reasoning);
      // With a schema, always the forced json tool, never Bedrock's native constrained output: the
      // reply is checked and repaired here either way, and native mode refuses ordinary schemas on
      // some models (over 24 optional fields; an enum on a field that also allows null).
      const providerOptions = payload.outputSchema
        ? { ...reasoningOptions, bedrock: { ...reasoningOptions?.bedrock, structuredOutputMode: 'jsonTool' as const } }
        : reasoningOptions;

      const callModel = (promptOrMessages: { prompt: string } | { messages: ModelMessage[] }, output?: ReturnType<typeof Output.object>) =>
        generateText({
          model: prepared.model,
          system: toCacheableSystem(payload.system, payload.caching, cache),
          ...promptOrMessages,
          tools: prepared.tools,
          providerOptions,
          stopWhen: buildAiStopConditions(payload),
          maxOutputTokens: payload.maxOutputTokens,
          prepareStep: payload.caching ? createCachePrepareStep({ ...cache, durableCount: input.durableCount }) : undefined,
          output,
        });

      if (!payload.outputSchema) {
        const result = await callModel(input.promptOrMessages);
        const usage = toAiStreamUsage(result.usage);
        if (payload.caching) {
          logAiCacheUsage(usage);
        }
        return actionResult({ text: result.text, usage });
      }

      const output = Output.object({ schema: jsonSchema(payload.outputSchema) });
      const generate: AiOutputObjectGenerate = (promptOrMessages) => generateOutputObjectReply(() => callModel(promptOrMessages, output));

      const answer = await generateAiOutputObject(generate, input.promptOrMessages, payload.outputSchema, payload.outputRepairAttempts ?? 0);
      const usage = sumAiStreamUsage(answer.usages);
      if (payload.caching) {
        logAiCacheUsage(usage);
      }

      if (!answer.valid) {
        return actionResultError(ErrorTypeEnum.Invalid, `The reply does not match the output schema: ${answer.problems}`);
      }

      return actionResult({ text: answer.text, usage, object: answer.object, repairs: answer.repairs });
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return actionResultError(ErrorTypeEnum.Invalid, `The reply is not JSON matching the output schema: ${error.message}`);
      }

      if (error instanceof Error) {
        return actionResultError(ErrorTypeEnum.GenericError, error.message);
      }

      return actionResultError(ErrorTypeEnum.GenericError, 'An error occurred during AI prompt execution.');
    }
  };
};

export const getAiPromptActionProcessor = createActionProcessor(askAiPrompt, getProcessAiPrompt);
