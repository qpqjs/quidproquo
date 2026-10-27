import { getUniqueKeyFromQpqFunctionRuntime } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineRoute } from './route';

const runtime = '/src/routes/getOrders::getOrders';

describe('defineRoute', () => {
  it('builds a Route setting keyed by the runtime unique key', () => {
    const setting = defineRoute('GET', '/orders', runtime);

    expect(setting.configSettingType).toBe(QPQWebServerConfigSettingType.Route);
    expect(setting.uniqueKey).toBe(getUniqueKeyFromQpqFunctionRuntime(runtime));
    expect(setting.method).toBe('GET');
    expect(setting.path).toBe('/orders');
    expect(setting.runtime).toBe(runtime);
  });

  it('defaults options to empty route auth settings with no api keys', () => {
    const setting = defineRoute('GET', '/orders', runtime);

    expect(setting.options.routeAuthSettings).toEqual({ apiKeys: [] });
  });

  it('normalises string api keys into reference objects', () => {
    const setting = defineRoute('POST', '/orders', runtime, {
      routeAuthSettings: { apiKeys: ['public', { name: 'partner', serviceName: 'billing' }] },
    });

    expect(setting.options.routeAuthSettings?.apiKeys).toEqual([{ name: 'public' }, { name: 'partner', serviceName: 'billing' }]);
  });
});
