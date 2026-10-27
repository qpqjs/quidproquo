import { Action, ConfigActionType, ErrorTypeEnum, LogActionType, runStory, StoryError, throwsError } from 'quidproquo-core';
import { HTTPEvent, ServiceFunctionActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { MCP_EXPORT_LIST_TOOLS_FN } from '../constants/mcpExportListToolsFn';
import { MCP_EXPORT_RUN_TOOL_FN } from '../constants/mcpExportRunToolFn';
import { MCP_REMOTE_PREFIX_GLOBAL } from '../constants/mcpRemotePrefixGlobal';
import { MCP_REMOTE_SERVICE_GLOBAL } from '../constants/mcpRemoteServiceGlobal';
import { askMcpRemoteListTools } from './askMcpRemoteListTools';
import { askMcpRemoteRunTool } from './askMcpRemoteRunTool';

const event = { path: '/mcp', headers: { Authorization: 'Basic secret', 'content-type': 'application/json' } } as unknown as HTTPEvent;
const forwardedEvent = { path: '/mcp', headers: { 'content-type': 'application/json' } };

type ServiceCall = Action<{ service: string; functionName: string; payload: unknown }>;

const globals = {
  [ConfigActionType.GetGlobal]: (action: Action<{ globalName: string }>) =>
    ({ [MCP_REMOTE_SERVICE_GLOBAL]: 'template', [MCP_REMOTE_PREFIX_GLOBAL]: 'template' })[action.payload!.globalName],
};

describe('askMcpRemoteListTools', () => {
  it("lists the exporting service's tools with the prefix, sending the request without its credentials", () => {
    const calls: ServiceCall[] = [];

    const tools = runStory(askMcpRemoteListTools({ event }), {
      ...globals,
      [ServiceFunctionActionType.Execute]: (action: ServiceCall) => {
        calls.push(action);
        return [{ name: 'setLayout', description: 'Set the layout', inputSchema: {} }];
      },
    });

    expect(calls.map(({ payload }) => [payload!.service, payload!.functionName, payload!.payload])).toEqual([
      ['template', MCP_EXPORT_LIST_TOOLS_FN, { event: forwardedEvent }],
    ]);
    expect(tools).toEqual([{ name: 'template_setLayout', description: 'Set the layout', inputSchema: {} }]);
  });

  it('offers no tools, and logs why, when the service cannot answer', () => {
    const logged: string[] = [];

    const tools = runStory(askMcpRemoteListTools({ event }), {
      ...globals,
      [ServiceFunctionActionType.Execute]: throwsError(ErrorTypeEnum.GenericError, 'template is down'),
      [LogActionType.Create]: (action: Action<{ msg: string }>) => {
        logged.push(action.payload!.msg);
      },
    });

    expect(tools).toEqual([]);
    expect(logged).toEqual([expect.stringContaining('template is down')]);
  });
});

describe('askMcpRemoteRunTool', () => {
  it("runs the call under the service's own tool name, without the request's credentials", () => {
    const calls: ServiceCall[] = [];

    const result = runStory(askMcpRemoteRunTool({ name: 'template_setLayout', args: { docId: 'd1', layoutId: 'l1' }, event }), {
      ...globals,
      [ServiceFunctionActionType.Execute]: (action: ServiceCall) => {
        calls.push(action);
        return { ok: true };
      },
    });

    expect(calls.map(({ payload }) => [payload!.service, payload!.functionName, payload!.payload])).toEqual([
      ['template', MCP_EXPORT_RUN_TOOL_FN, { name: 'setLayout', args: { docId: 'd1', layoutId: 'l1' }, event: forwardedEvent }],
    ]);
    expect(result).toEqual({ ok: true });
  });

  it('refuses a name without its prefix rather than guessing a service', () => {
    expect(() => runStory(askMcpRemoteRunTool({ name: 'flow_describe', args: {}, event }), globals)).toThrow(StoryError);
  });
});
