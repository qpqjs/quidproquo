import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../../../testing/processorTestHelpers';
import { GraphDatabaseForNeptuneActionType } from '../actions';
import { getGraphDatabaseForNeptuneSignRequestActionProcessor } from './getGraphDatabaseForNeptuneSignRequestActionProcessor';

vi.mock('@qpqjs/config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));

// A fixed key, so the signature is a function of the request alone.
vi.mock('@aws-sdk/credential-provider-node', () => ({
  defaultProvider: () => async () => ({ accessKeyId: 'AKIATESTKEY', secretAccessKey: 'test-secret', sessionToken: 'test-session' }),
}));

const invoke = async (url: string, body: string) => {
  const processor = (await getGraphDatabaseForNeptuneSignRequestActionProcessor({} as never, null as any))[
    GraphDatabaseForNeptuneActionType.SignRequest
  ];
  const [headers, error] = await invokeProcessor<Record<string, string>>(processor, { url, body });
  expect(error).toBeUndefined();
  return headers!;
};

// Security regression: every openCypher request carries a SigV4 signature for neptune-db over the exact body, so a
// caller on the network without the service role's credentials cannot query the cluster.
describe('getProcessSignRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('signs the request for neptune-db in the deploy region with the fixed key', async () => {
    const headers = await invoke('https://cluster.example.com:8182/openCypher', '{"query":"RETURN 1"}');

    expect(headers['x-amz-date']).toBe('20260101T000000Z');
    expect(headers['x-amz-security-token']).toBe('test-session');
    expect(headers.host).toBe('cluster.example.com:8182');
    expect(headers.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIATESTKEY\/20260101\/us-test-1\/neptune-db\/aws4_request, SignedHeaders=[a-z0-9;-]+, Signature=[0-9a-f]{64}$/,
    );
    expect(headers.authorization).toContain('host;');
  });

  it('is deterministic for the same request and changes with the body', async () => {
    const first = await invoke('https://cluster.example.com:8182/openCypher', '{"query":"RETURN 1"}');
    const same = await invoke('https://cluster.example.com:8182/openCypher', '{"query":"RETURN 1"}');
    const other = await invoke('https://cluster.example.com:8182/openCypher', '{"query":"MATCH (n) DETACH DELETE n"}');

    expect(same.authorization).toBe(first.authorization);
    expect(other.authorization).not.toBe(first.authorization);
  });
});
