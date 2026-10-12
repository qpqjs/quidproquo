import { Action, ErrorTypeEnum, InlineFunctionActionType, runStory, throwsError } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { McpActionType } from '../actions/McpActionType';
import { McpJsonRpcErrorCode } from '../constants/McpJsonRpcErrorCode';
import { McpConfig } from '../models/McpConfig';
import { askMcpHandleRequest } from './askMcpHandleRequest';

const event = { headers: {} } as unknown as HTTPEvent;

const config: McpConfig = {
  serverName: 'kiln',
  tools: [{ name: 'createPlan', description: 'Create a plan', executor: 'createPlanFn', inputSchema: {} }],
  toolsets: [{ name: 'docs', listTools: 'docsListFn', runTool: 'docsRunFn', instructions: 'Find the document first.' }],
};

type ExecuteAction = Action<{ functionName: string; payload: unknown }>;

const callTool = (name: string, args: Record<string, unknown>) => ({
  jsonrpc: '2.0',
  id: 7,
  method: 'tools/call',
  params: { name, arguments: args },
});

// The stand-in toolset lists one tool and echoes what runTool was given.
const runInlineFunction = (executed: ExecuteAction[]) => (action: ExecuteAction) => {
  executed.push(action);

  switch (action.payload!.functionName) {
    case 'docsListFn':
      return [{ name: 'describeFlow', description: 'Describe a flow', inputSchema: { type: 'object', properties: { flowId: { type: 'string' } } } }];
    case 'docsRunFn':
      return { ran: action.payload!.payload };
    case 'createPlanFn':
      return { docId: 'doc-9' };
    default:
      return undefined;
  }
};

const buildMocks = (executed: ExecuteAction[] = []) => ({
  [McpActionType.ReadConfig]: config,
  [InlineFunctionActionType.Execute]: runInlineFunction(executed),
});

describe('askMcpHandleRequest', () => {
  it('returns null for a notification so the route answers 202', () => {
    const response = runStory(askMcpHandleRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, event), buildMocks());

    expect(response).toBeNull();
  });

  it('refuses a body that is not one JSON-RPC request', () => {
    const response = runStory(askMcpHandleRequest([{ jsonrpc: '2.0', id: 1, method: 'ping' }], event), buildMocks());

    expect(response).toEqual({ jsonrpc: '2.0', id: null, error: { code: McpJsonRpcErrorCode.InvalidRequest, message: expect.any(String) } });
  });

  it('echoes a supported protocol version on initialize, offers the newest otherwise, and sends toolset instructions', () => {
    const known = runStory(
      askMcpHandleRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, event),
      buildMocks(),
    );
    const unknown = runStory(
      askMcpHandleRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1999-01-01' } }, event),
      buildMocks(),
    );

    expect(known).toMatchObject({
      result: { protocolVersion: '2025-06-18', serverInfo: { name: 'kiln' }, capabilities: { tools: {} }, instructions: 'Find the document first.' },
    });
    expect(unknown).toMatchObject({ result: { protocolVersion: '2025-11-25' } });
  });

  it('lists the server tools and what each toolset lists', () => {
    const response = runStory(askMcpHandleRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, event), buildMocks());

    expect(response).toMatchObject({ result: { tools: [{ name: 'createPlan' }, { name: 'describeFlow' }] } });
  });

  it('answers an unknown method with MethodNotFound', () => {
    const response = runStory(askMcpHandleRequest({ jsonrpc: '2.0', id: 3, method: 'resources/list' }, event), buildMocks());

    expect(response).toMatchObject({ id: 3, error: { code: McpJsonRpcErrorCode.MethodNotFound } });
  });

  it('answers an unknown tool with InvalidParams', () => {
    const response = runStory(askMcpHandleRequest(callTool('dropTables', {}), event), buildMocks());

    expect(response).toMatchObject({ id: 7, error: { code: McpJsonRpcErrorCode.InvalidParams } });
  });

  it('hands a toolset tool to its runTool with the name, the request and the arguments as given', () => {
    const executed: ExecuteAction[] = [];

    runStory(askMcpHandleRequest(callTool('describeFlow', { docId: 'doc-1', flowId: 'f1' }), event), buildMocks(executed));

    const run = executed.find((action) => action.payload!.functionName === 'docsRunFn');
    expect(run?.payload!.payload).toEqual({ name: 'describeFlow', args: { docId: 'doc-1', flowId: 'f1' }, event });
  });

  it('runs a server tool executor directly with its arguments', () => {
    const executed: ExecuteAction[] = [];

    const response = runStory(askMcpHandleRequest(callTool('createPlan', { request: 'Onboard staff' }), event), buildMocks(executed));

    const run = executed.find((action) => action.payload!.functionName === 'createPlanFn');
    expect(run?.payload!.payload).toEqual({ request: 'Onboard staff' });
    expect(response).toMatchObject({ result: { content: [{ text: '{"docId":"doc-9"}' }] } });
  });

  it('returns a tool that fails as an isError result, not a protocol error', () => {
    const response = runStory(askMcpHandleRequest(callTool('createPlan', {}), event), {
      ...buildMocks(),
      [InlineFunctionActionType.Execute]: (action: ExecuteAction) =>
        action.payload!.functionName === 'createPlanFn' ? throwsError(ErrorTypeEnum.Forbidden, 'Not a Flow author') : runInlineFunction([])(action),
    });

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 7,
      result: { content: [{ type: 'text', text: 'Forbidden: Not a Flow author' }], isError: true },
    });
  });
});
