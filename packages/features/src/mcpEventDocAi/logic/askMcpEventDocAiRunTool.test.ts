import { Action, ConfigActionType, InlineFunctionActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory, StoryError } from '@qpqjs/testing';
import { HTTPEvent } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { McpEventDocAiActionType } from '../actions/McpEventDocAiActionType';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { askMcpEventDocAiRunTool } from './askMcpEventDocAiRunTool';

const event = { headers: {} } as unknown as HTTPEvent;

const eventDocAis: McpEventDocAi[] = [
  {
    isCollection: true,
    aiName: 'mimir',
    serviceName: 'mimir',
    type: 'plan',
    store: { ...buildEventDocStore({ storeName: 'mimirPlans', type: 'plan' }), authorise: 'authoriseFn' },
    tools: [{ name: 'describeFlow', description: 'Describe a flow', executor: 'describeFlowFn', inputSchema: {} }],
  },
];

const plan = { id: 'doc-1', code: 'P1', name: 'Onboarding plan', type: 'plan', updatedAt: '2026-10-12T00:00:00.000Z' };

type ExecuteAction = Action<{ functionName: string; payload: unknown }> & { context?: Record<string, unknown> };

const buildMocks = (plans: unknown[], executed: ExecuteAction[] = [], excludedTools: string[] = []) => ({
  [McpEventDocAiActionType.ReadConfig]: eventDocAis,
  [ConfigActionType.GetGlobal]: excludedTools,
  [KeyValueStoreActionType.Query]: { items: plans },
  [InlineFunctionActionType.Execute]: (action: ExecuteAction) => {
    executed.push(action);
    return action.payload!.functionName === 'describeFlowFn' ? { flowId: 'f1', name: 'Intake' } : undefined;
  },
});

describe('askMcpEventDocAiRunTool', () => {
  it('runs an AI tool in the doc context the chat would give it, after the collection check, with only its own arguments', () => {
    const executed: ExecuteAction[] = [];

    const result = runStory(
      askMcpEventDocAiRunTool({ name: 'describeFlow', args: { docId: 'doc-1', flowId: 'f1' }, event }),
      buildMocks([plan], executed),
    );

    const toolRun = executed.find((action) => action.payload!.functionName === 'describeFlowFn');

    expect(executed.map((action) => action.payload!.functionName)).toEqual(['authoriseFn', 'describeFlowFn']);
    expect(toolRun?.payload!.payload).toEqual({ flowId: 'f1' });
    expect(toolRun?.context).toMatchObject({ 'event-doc-ai-context': { serviceName: 'mimir', type: 'plan', docId: 'doc-1' } });
    expect(result).toEqual({ flowId: 'f1', name: 'Intake' });
  });

  it('runs an AI tool with an empty docId in its context when none is given, skipping the doc check', () => {
    const executed: ExecuteAction[] = [];

    runStory(askMcpEventDocAiRunTool({ name: 'describeFlow', args: { flowId: 'f1' }, event }), buildMocks([], executed));

    expect(executed.map((action) => action.payload!.functionName)).toEqual(['describeFlowFn']);
    expect(executed[0].context).toMatchObject({ 'event-doc-ai-context': { docId: '' } });
  });

  it('fails with NotFound for a docId that is not here, without running the tool', () => {
    const executed: ExecuteAction[] = [];

    expect(() => runStory(askMcpEventDocAiRunTool({ name: 'describeFlow', args: { docId: 'missing' }, event }), buildMocks([], executed))).toThrow(
      /No plan with id missing/,
    );
    expect(executed.map((action) => action.payload!.functionName)).toEqual(['authoriseFn']);
  });

  it('lists docs, trimmed to what a model needs to match a name', () => {
    const result = runStory(askMcpEventDocAiRunTool({ name: 'listDocs', args: {}, event }), buildMocks([plan]));

    expect(result).toEqual({ items: [{ id: 'doc-1', name: 'Onboarding plan', code: 'P1', updatedAt: '2026-10-12T00:00:00.000Z' }] });
  });

  it('fails for a tool it does not offer', () => {
    expect(() => runStory(askMcpEventDocAiRunTool({ name: 'dropTables', args: {}, event }), buildMocks([]))).toThrow(StoryError);
  });

  it('refuses a tool the toolset excludes, as if it did not exist', () => {
    const executed: ExecuteAction[] = [];

    expect(() =>
      runStory(askMcpEventDocAiRunTool({ name: 'describeFlow', args: { flowId: 'f1' }, event }), buildMocks([], executed, ['describeFlow'])),
    ).toThrow(/Unknown tool: describeFlow/);
    expect(executed).toEqual([]);
  });

  it("hands a chat-only AI's docId straight to its tool, with no collection check", () => {
    const executed: ExecuteAction[] = [];

    runStory(askMcpEventDocAiRunTool({ name: 'describeFlow', args: { docId: 'reg-1', flowId: 'f1' }, event }), {
      ...buildMocks([], executed),
      [McpEventDocAiActionType.ReadConfig]: [{ ...eventDocAis[0], type: 'register', isCollection: false }],
    });

    expect(executed.map((action) => action.payload!.functionName)).toEqual(['describeFlowFn']);
    expect(executed[0].context).toMatchObject({ 'event-doc-ai-context': { type: 'register', docId: 'reg-1' } });
  });
});
