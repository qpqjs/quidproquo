import { ActionProcessor, DynamicModuleLoader } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { McpActionType } from '../../actions/McpActionType';
import { defineMcpServer } from '../../config/defineMcpServer';
import { defineMcpToolset } from '../../config/defineMcpToolset';
import { getMcpReadConfig } from './getMcpReadConfig';

const loader = (async () => undefined) as unknown as DynamicModuleLoader;

// The processor ignores everything but its (empty) payload.
const runProcessor = async (processor: ActionProcessor<never>) => (processor as unknown as () => Promise<unknown>)();

describe('getMcpReadConfig', () => {
  it('registers under the ReadConfig action and answers from the service config', async () => {
    const processors = await getMcpReadConfig(
      [
        defineMcpToolset({ name: 'docs', listTools: 'docsListFn', runTool: 'docsRunFn' }),
        defineMcpServer({ userDirectoryName: 'users', serverName: 'kiln' }),
      ],
      loader,
    );

    const result = await runProcessor(processors[McpActionType.ReadConfig]);

    expect(result).toMatchObject([{ serverName: 'kiln', toolsets: [{ name: 'docs' }] }]);
  });

  it('fails with NotFound when the service has no defineMcpServer', async () => {
    const processors = await getMcpReadConfig([], loader);

    const result = await runProcessor(processors[McpActionType.ReadConfig]);

    expect(result).toMatchObject([undefined, { errorType: 'NotFound' }]);
  });
});
