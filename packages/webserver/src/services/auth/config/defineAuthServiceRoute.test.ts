import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../../../config/QPQConfig';
import { getServiceEntryQpqFunctionRuntime } from '../../getServiceEntryQpqFunctionRuntime';
import { defineAuthServiceRoute } from './defineAuthServiceRoute';

describe('defineAuthServiceRoute', () => {
  it('builds a route setting pointing at the auth controller method', () => {
    const setting = defineAuthServiceRoute('POST', '/login', 'login');

    expect(setting.configSettingType).toBe(QPQWebServerConfigSettingType.Route);
    expect(setting.method).toBe('POST');
    expect(setting.path).toBe('/login');
    expect(setting.runtime).toEqual(getServiceEntryQpqFunctionRuntime('auth', 'controller', 'authController::login'));
  });

  it('normalises string api keys into references', () => {
    const setting = defineAuthServiceRoute('POST', '/login', 'login', {
      routeAuthSettings: { apiKeys: ['my-key'] },
    });

    expect(setting.options.routeAuthSettings?.apiKeys).toEqual([{ name: 'my-key' }]);
  });

  it('defaults options to empty auth settings when omitted', () => {
    const setting = defineAuthServiceRoute('GET', '/me', 'me');

    expect(setting.options.routeAuthSettings).toEqual({ apiKeys: [] });
  });
});
