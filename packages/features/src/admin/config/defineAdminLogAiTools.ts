import { AiToolDefinition, defineInlineFunction, QPQConfig, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';

const adminLogAiToolGetActionsName = 'askAdminLogAiToolGetActions';
const adminLogAiToolGetActionDetailName = 'askAdminLogAiToolGetActionDetail';

const runtime = (functionName: string): QpqFunctionRuntimeAdvanced => ({
  basePath: __dirname,
  relativePath: `../logic/aiTools/${functionName}`,
  functionName,
});

// The two tools the log chat AI gets instead of the whole log JSON — see
// adminLogAiSystemPrompt for how it's told to use them.
export const adminLogAiTools: AiToolDefinition[] = [
  {
    name: 'getLogActions',
    description:
      'List every action in the currently open log, in order — its type, when it started/finished, execution time in ms, and whether it errored. Call this first to see what happened before asking for any one action in detail.',
    executor: adminLogAiToolGetActionsName,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'getLogAction',
    description:
      'Get the full detail for one action from the currently open log by its index (from getLogActions) — its complete input payload and its complete output (result, or error if it failed).',
    executor: adminLogAiToolGetActionDetailName,
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'The zero-based index of the action, as returned by getLogActions.' },
      },
      required: ['index'],
      additionalProperties: false,
    },
  },
];

export const defineAdminLogAiTools = (): QPQConfig => [
  defineInlineFunction(runtime(adminLogAiToolGetActionsName), { functionName: adminLogAiToolGetActionsName }),
  defineInlineFunction(runtime(adminLogAiToolGetActionDetailName), { functionName: adminLogAiToolGetActionDetailName }),
];
