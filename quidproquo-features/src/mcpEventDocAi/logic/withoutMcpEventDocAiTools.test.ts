import { describe, expect, it } from 'vitest';

import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { buildMcpEventDocAiToolBindings } from './buildMcpEventDocAiToolBindings';
import { withoutMcpEventDocAiTools } from './withoutMcpEventDocAiTools';

const ai = (type: string): McpEventDocAi => ({
  isCollection: true,
  aiName: type,
  serviceName: 'template',
  type,
  store: buildEventDocStore({ storeName: type, type }),
  tools: [
    { name: 'whatIsHere', description: 'Shared read', executor: 'whatIsHereFn', inputSchema: {} },
    { name: `edit_${type}`, description: 'Own tool', executor: `edit_${type}Fn`, inputSchema: {} },
  ],
});

describe('withoutMcpEventDocAiTools', () => {
  it('takes excluded tools out before naming, so a shared tool no longer needs a type prefix', () => {
    const offered = withoutMcpEventDocAiTools([ai('template'), ai('content')], ['whatIsHere']);

    expect(buildMcpEventDocAiToolBindings(offered).map(({ tool }) => tool.name)).toEqual(['listDocs', 'edit_template', 'edit_content']);
  });

  it('leaves every tool when nothing is excluded', () => {
    expect(withoutMcpEventDocAiTools([ai('template')], [])[0].tools.map(({ name }) => name)).toEqual(['whatIsHere', 'edit_template']);
  });
});
