import { buildTestQpqConfig } from '@qpqjs/core';
import { DnsActionType, OpenApiActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getWebserverActionProcessor } from './index';

describe('getWebserverActionProcessor', () => {
  it('exposes the dns and openApi action processors', async () => {
    const apl = await getWebserverActionProcessor(buildTestQpqConfig(), async () => null);

    expect(typeof apl[DnsActionType.List]).toBe('function');
    expect(typeof apl[OpenApiActionType.GetDocument]).toBe('function');
  });
});
