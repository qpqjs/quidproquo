// @vitest-environment jsdom
import { buildTestQpqConfig, noopDynamicModuleLoader } from 'quidproquo-core';
import { WindowActionType } from 'quidproquo-web';

import { describe, expect, it } from 'vitest';

import { getWindowGetLocationActionProcessor } from './getWindowGetLocationActionProcessor';

const getProcessor = async () => {
  const processors = await getWindowGetLocationActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[WindowActionType.GetLocation] as (p: any, ...rest: any[]) => Promise<any>;
};

describe('getWindowGetLocationActionProcessor', () => {
  it('returns a plain serializable copy of window.location', async () => {
    window.history.replaceState(null, '', '/dashboard?tab=home#section');
    const processor = await getProcessor();

    const [result] = await processor(undefined);

    expect(result).toEqual({
      href: window.location.href,
      origin: window.location.origin,
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: '/dashboard',
      search: '?tab=home',
      hash: '#section',
    });
    expect(result).not.toBeInstanceOf(Location);
  });
});
