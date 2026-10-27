import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askDnsResolveHosts } from './askDnsResolveHosts';
import { DnsActionType } from './DnsActionType';

describe('askDnsResolveHosts', () => {
  it('yields a ResolveHosts action carrying the target', () => {
    const { action } = captureRequester(askDnsResolveHosts({ subdomain: 'api' }));

    expect(action).toEqual({ type: DnsActionType.ResolveHosts, payload: { subdomain: 'api' } });
  });

  it('defaults to the site root target', () => {
    const { action } = captureRequester(askDnsResolveHosts());

    expect(action).toEqual({ type: DnsActionType.ResolveHosts, payload: {} });
  });
});
