import { describe, expect, it } from 'vitest';

import { defineMcpServer } from '../config/defineMcpServer';
import { defineMcpToolset } from '../config/defineMcpToolset';
import { buildMcpConfig } from './buildMcpConfig';

const toolset = { name: 'docs', listTools: 'docsListFn', runTool: 'docsRunFn', instructions: 'Find docs first.' };

describe('buildMcpConfig', () => {
  it('is null without defineMcpServer', () => {
    expect(buildMcpConfig([defineMcpToolset(toolset)])).toBeNull();
  });

  it('joins the server setting with every toolset in the service', () => {
    const config = buildMcpConfig([defineMcpServer({ userDirectoryName: 'users', serverName: 'kiln' }), defineMcpToolset(toolset)]);

    expect(config).toEqual({ serverName: 'kiln', tools: [], toolsets: [toolset] });
  });
});
