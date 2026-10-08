import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  ActionProcessorList,
  AiModel,
  askInlineFunctionExecute,
  createImplementationRuntime,
  DynamicModuleLoader,
  ErrorTypeEnum,
  QPQConfig,
  qpqCoreUtils,
  QpqLogger,
  StorySession,
  StreamRegistry,
} from 'quidproquo-core';

import type { ToolSet } from 'ai';
import { jsonSchema } from 'ai';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

import { randomGuid } from '../../../../awsLambdaUtils';
import { bedrockModelMap } from '../aiModelMap';
import { bedrockDataRegion } from '../bedrockDataRegion';

export type PrepareAiPromptCallPayload = {
  model: AiModel;
  aiName?: string;
};

type BedrockProvider = ReturnType<typeof createAmazonBedrock>;
type BedrockLanguageModel = ReturnType<BedrockProvider>;

export type PrepareAiPromptCallResult =
  { error: { type: ErrorTypeEnum; message: string } } | { model: BedrockLanguageModel; tools: ToolSet | undefined };

export const prepareAiPromptCall = (
  qpqConfig: QPQConfig,
  payload: PrepareAiPromptCallPayload,
  session: StorySession,
  actionProcessorList: ActionProcessorList,
  logger: QpqLogger,
  dynamicModuleLoader: DynamicModuleLoader,
  streamRegistry?: StreamRegistry,
): PrepareAiPromptCallResult => {
  const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
  const bedrock = createAmazonBedrock({ region });

  const bedrockModelId = bedrockModelMap[payload.model]?.[bedrockDataRegion];
  if (!bedrockModelId) {
    return { error: { type: ErrorTypeEnum.NotImplemented, message: `Unsupported AI model in ${bedrockDataRegion}: ${payload.model}` } };
  }

  const aiTools: ToolSet = {};

  if (payload.aiName) {
    const aiConfigs = qpqCoreUtils.getAllAiConfigs(qpqConfig);
    const aiConfig = aiConfigs.find((c) => c.aiName === payload.aiName);

    if (!aiConfig) {
      return { error: { type: ErrorTypeEnum.NotFound, message: `AI config not found: ${payload.aiName}` } };
    }

    // Runs the tool's inline-function executor as its own story.
    const createToolExecute = (toolName: string, executor: string) => async (args: unknown) => {
      const resolveStory = createImplementationRuntime(
        qpqConfig,
        [`AI Tool: ${toolName}`],
        () => new Date().toISOString(),
        randomGuid,
        session,
        actionProcessorList,
        logger,
        dynamicModuleLoader,
        streamRegistry,
      );

      const storyResult = await resolveStory(askInlineFunctionExecute, [executor, args]);

      if (storyResult.error) {
        throw new Error(storyResult.error.errorText);
      }

      return storyResult.result;
    };

    for (const toolDef of aiConfig.tools) {
      aiTools[toolDef.name] = {
        description: toolDef.description,
        inputSchema: jsonSchema(toolDef.inputSchema),
        // A tool without an executor is client-side: the AI SDK emits the tool call
        // but has nothing to run, so the loop halts with the call unresolved and the
        // client answers it out-of-band (see AiToolDefinition.executor).
        ...(toolDef.executor ? { execute: createToolExecute(toolDef.name, toolDef.executor) } : {}),
      };
    }
  }

  return {
    model: bedrock(bedrockModelId),
    tools: Object.keys(aiTools).length > 0 ? aiTools : undefined,
  };
};
