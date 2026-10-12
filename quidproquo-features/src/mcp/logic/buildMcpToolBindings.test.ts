import { describe, expect, it } from 'vitest';

import { McpConfig } from '../models/McpConfig';
import { McpToolKind } from '../models/McpToolKind';
import { McpToolsetListing } from '../models/McpToolsetListing';
import { buildMcpToolBindings } from './buildMcpToolBindings';

const schema = { type: 'object', properties: { flowId: { type: 'string' } }, required: ['flowId'] };
const toolset = { name: 'docs', listTools: 'docsListFn', runTool: 'docsRunFn' };

const config: McpConfig = {
  serverName: 'kiln',
  tools: [
    { name: 'createPlan', description: 'Create a plan', executor: 'createPlanFn', inputSchema: { type: 'object', properties: {} } },
    { name: 'askUser', description: 'Answered by the browser', inputSchema: {} },
  ],
  toolsets: [toolset],
};

const listings: McpToolsetListing[] = [{ toolset, tools: [{ name: 'describeFlow', description: 'Describe a flow', inputSchema: schema }] }];

describe('buildMcpToolBindings', () => {
  it('offers the server tools, then toolset tools', () => {
    const names = buildMcpToolBindings(config, listings).map(({ tool }) => tool.name);

    expect(names).toEqual(['createPlan', 'describeFlow']);
  });

  it('skips server tools with no executor, since a browser answers those', () => {
    const names = buildMcpToolBindings(config, listings).map(({ tool }) => tool.name);

    expect(names).not.toContain('askUser');
  });

  it('binds a toolset tool to its toolset runTool, with its schema as listed', () => {
    const describeFlow = buildMcpToolBindings(config, listings).find(({ tool }) => tool.name === 'describeFlow');

    expect(describeFlow).toEqual({
      kind: McpToolKind.Toolset,
      runTool: 'docsRunFn',
      tool: { name: 'describeFlow', description: 'Describe a flow', inputSchema: schema },
    });
  });

  it('keeps the first tool when two share a name', () => {
    const clash: McpToolsetListing[] = [{ toolset, tools: [{ name: 'createPlan', description: 'clash', inputSchema: {} }] }];
    const bindings = buildMcpToolBindings(config, clash);

    expect(bindings.filter(({ tool }) => tool.name === 'createPlan')).toEqual([expect.objectContaining({ kind: McpToolKind.Executor })]);
  });
});
