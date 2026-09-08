import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineDomainProxy, DomainProxyDomainOptions, DomainProxyViewerProtocolPolicy } from './domainProxy';

const domain: DomainProxyDomainOptions = { onRootDomain: true };

describe('defineDomainProxy', () => {
  it('builds a DomainProxy setting defaulting ignoreCache to an empty array', () => {
    expect(
      defineDomainProxy('proxy', {
        httpProxyDomain: 'origin.example.com',
        domain,
        domainProxyViewerProtocolPolicy: DomainProxyViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }),
    ).toEqual({
      configSettingType: QPQWebServerConfigSettingType.DomainProxy,
      uniqueKey: 'proxy',
      name: 'proxy',
      httpProxyDomain: 'origin.example.com',
      domain,
      ignoreCache: [],
      cacheSettingsName: undefined,
      domainProxyViewerProtocolPolicy: DomainProxyViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });
  });

  it('passes through ignoreCache and the cache settings name', () => {
    const setting = defineDomainProxy('proxy', {
      httpProxyDomain: 'origin.example.com',
      domain,
      ignoreCache: ['/health'],
      cacheSettingsName: 'cdn',
      domainProxyViewerProtocolPolicy: DomainProxyViewerProtocolPolicy.HTTPS_ONLY,
    });

    expect(setting.ignoreCache).toEqual(['/health']);
    expect(setting.cacheSettingsName).toBe('cdn');
  });
});
