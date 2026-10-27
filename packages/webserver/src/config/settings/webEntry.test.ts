import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineWebEntry, WebDomainOptions } from './webEntry';

const domain: WebDomainOptions = { onRootDomain: true };

describe('defineWebEntry', () => {
  it('applies index, storage drive, compression and cache defaults', () => {
    expect(defineWebEntry('site', { domain })).toEqual({
      configSettingType: QPQWebServerConfigSettingType.WebEntry,
      uniqueKey: 'site',
      name: 'site',
      indexRoot: 'index.html',
      storageDrive: { autoUpload: true },
      domain,
      buildPath: undefined,
      ignoreCache: [],
      compressFiles: true,
      securityHeaders: undefined,
      cloudflareApiKeySecretName: undefined,
      cacheSettingsName: undefined,
    });
  });

  it('honours overrides including compressFiles false', () => {
    const setting = defineWebEntry('site', {
      domain,
      indexRoot: 'main.html',
      buildPath: './dist',
      compressFiles: false,
      ignoreCache: ['/api'],
      storageDrive: { autoUpload: false, sourceStorageDrive: 'assets' },
    });

    expect(setting.indexRoot).toBe('main.html');
    expect(setting.buildPath).toBe('./dist');
    expect(setting.compressFiles).toBe(false);
    expect(setting.ignoreCache).toEqual(['/api']);
    expect(setting.storageDrive).toEqual({ autoUpload: false, sourceStorageDrive: 'assets' });
  });
});
