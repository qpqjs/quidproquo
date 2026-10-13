import { Action, InlineFunctionActionType, runStory, StoryError } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { McpActionType } from '../actions/McpActionType';
import { askMcpExportListTools } from './askMcpExportListTools';
import { askMcpExportRunTool } from './askMcpExportRunTool';

const event = { path: '/mcp', headers: {} } as unknown as HTTPEvent;

type ExecuteAction = Action<{ functionName: string; payload: unknown }>;

const mocks = (executed: ExecuteAction[] = []) => ({
  [McpActionType.ReadToolsets]: [{ name: 'docs', listTools: 'docsListFn', runTool: 'docsRunFn' }],
  [InlineFunctionActionType.Execute]: (action: ExecuteAction) => {
    executed.push(action);
    return action.payload!.functionName === 'docsListFn' ? [{ name: 'setLayout', description: 'Set the layout', inputSchema: {} }] : { ran: true };
  },
});

describe('askMcpExportListTools', () => {
  it("lists the tools of this service's toolsets", () => {
    expect(runStory(askMcpExportListTools({ event }), mocks())).toEqual([{ name: 'setLayout', description: 'Set the layout', inputSchema: {} }]);
  });
});

describe('askMcpExportRunTool', () => {
  it("runs a tool through its toolset's runTool", () => {
    const executed: ExecuteAction[] = [];

    const result = runStory(askMcpExportRunTool({ name: 'setLayout', args: { docId: 'd1' }, event }), mocks(executed));

    expect(executed.map(({ payload }) => [payload!.functionName, payload!.payload])).toEqual([
      ['docsListFn', { event }],
      ['docsRunFn', { name: 'setLayout', args: { docId: 'd1' }, event }],
    ]);
    expect(result).toEqual({ ran: true });
  });

  it('refuses a tool none of its toolsets list', () => {
    expect(() => runStory(askMcpExportRunTool({ name: 'dropTables', args: {}, event }), mocks())).toThrow(StoryError);
  });
});
