import { describe, expect, it } from 'vitest';

import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { McpEventDocAiToolKind } from '../models/McpEventDocAiToolKind';
import { buildMcpEventDocAiToolBindings } from './buildMcpEventDocAiToolBindings';

const schema = { type: 'object', properties: { flowId: { type: 'string' } }, required: ['flowId'] };

const eventDocAis: McpEventDocAi[] = [
  {
    isCollection: true,
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

  it('offers a name two AIs share once per AI, under its doc type, and leaves other names alone', () => {
    const second: McpEventDocAi = {
      isCollection: true,
      aiName: 'notes',
      serviceName: 'mimir',
      type: 'note',
      store: buildEventDocStore({ storeName: 'notes', type: 'note' }),
      tools: [
        { name: 'describeFlow', description: 'Also describes a flow', executor: 'noteDescribeFlowFn', inputSchema: {} },
        { name: 'tagNote', description: 'Tag a note', executor: 'tagNoteFn', inputSchema: {} },
      ],
    };

    const bindings = buildMcpEventDocAiToolBindings([...eventDocAis, second]);

    expect(bindings.map(({ tool }) => tool.name)).toEqual(['listDocs', 'plan_describeFlow', 'note_describeFlow', 'tagNote']);
    expect(bindings.find(({ tool }) => tool.name === 'note_describeFlow')).toMatchObject({
      executor: 'noteDescribeFlowFn',
      eventDocAi: { type: 'note' },
    });
  });

  it('lists only collections, and leaves listDocs out when no AI has one', () => {
    const chatOnly: McpEventDocAi = { ...eventDocAis[0]!, aiName: 'registers', type: 'register', isCollection: false } as McpEventDocAi;

    expect(buildMcpEventDocAiToolBindings([chatOnly]).map(({ tool }) => tool.name)).not.toContain('listDocs');
    expect(buildMcpEventDocAiToolBindings!([...eventDocAis, { ...chatOnly, tools: [] }])[0]!.tool.inputSchema).toMatchObject({
      properties: { type: { enum: ['plan'] } },
    });
  });

  it("does not send a chat-only AI's docId to listDocs", () => {
    const chatOnly: McpEventDocAi = { ...eventDocAis[0]!, type: 'register', isCollection: false } as McpEventDocAi;
    const describeFlow = buildMcpEventDocAiToolBindings([chatOnly]).find(({ tool }) => tool.name === 'describeFlow');

    expect((describeFlow?.tool.inputSchema.properties as Record<string, { description: string }>)!.docId!.description).not.toMatch(/listDocs/);
  });
});
