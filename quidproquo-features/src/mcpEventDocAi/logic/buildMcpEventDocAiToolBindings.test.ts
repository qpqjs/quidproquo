import { describe, expect, it } from 'vitest';

import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { McpEventDocAiToolKind } from '../models/McpEventDocAiToolKind';
import { buildMcpEventDocAiToolBindings } from './buildMcpEventDocAiToolBindings';

const schema = { type: 'object', properties: { flowId: { type: 'string' } }, required: ['flowId'] };

const eventDocAis: McpEventDocAi[] = [
  {
    aiName: 'mimir',
    serviceName: 'mimir',
    type: 'plan',
    store: buildEventDocStore({ storeName: 'mimirPlans', type: 'plan' }),
    tools: [
      { name: 'describeFlow', description: 'Describe a flow', executor: 'describeFlowFn', inputSchema: schema },
      { name: 'askUser', description: 'Answered by the browser', inputSchema: {} },
    ],
  },
];

describe('buildMcpEventDocAiToolBindings', () => {
  it('offers listDocs first, then the AI tools that have an executor', () => {
    const bindings = buildMcpEventDocAiToolBindings(eventDocAis);

    expect(bindings.map(({ tool }) => tool.name)).toEqual(['listDocs', 'describeFlow']);
    expect(bindings[1]).toMatchObject({ kind: McpEventDocAiToolKind.Doc, executor: 'describeFlowFn' });
  });

  it('adds docId in front of an AI tool schema and keeps its own required list', () => {
    const describeFlow = buildMcpEventDocAiToolBindings(eventDocAis).find(({ tool }) => tool.name === 'describeFlow');

    expect(Object.keys(describeFlow?.tool.inputSchema.properties as object)).toEqual(['docId', 'flowId']);
    expect(describeFlow?.tool.inputSchema.required).toEqual(['flowId']);
  });

  it('offers nothing when the service has no eventDoc AI', () => {
    expect(buildMcpEventDocAiToolBindings([])).toEqual([]);
  });
});
