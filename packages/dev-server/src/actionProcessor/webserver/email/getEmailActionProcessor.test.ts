import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getEmailActionProcessor } from './getEmailActionProcessor';
import { getEmailSendEmailActionProcessor } from './getEmailSendEmailActionProcessor';
import { getEmailSetDeliveryStatusActionProcessor } from './getEmailSetDeliveryStatusActionProcessor';

const qpqConfig = buildTestQpqConfig();
const dynamicModuleLoader = noopDynamicModuleLoader;
const devServerConfig = buildTestDevServerConfig();

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getEmailActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getEmailSendEmailActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getEmailSetDeliveryStatusActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getEmailActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
