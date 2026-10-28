import { createHash } from 'crypto';
import { SignatureV4 } from '@smithy/signature-v4';
import { AwsCredentialIdentity, Checksum } from '@smithy/types';

// The signer wants a hash constructor; node's crypto provides one without another dependency.
class NodeSha256 implements Checksum {
  private hash = createHash('sha256');

  update(chunk: Uint8Array | string): void {
    this.hash.update(chunk);
  }

  async digest(): Promise<Uint8Array> {
    return new Uint8Array(this.hash.digest());
  }

  reset(): void {
    this.hash = createHash('sha256');
  }
}

/**
 * SigV4 headers for a neptune-db POST of exactly `body` (as JSON) to `url`. The cluster requires IAM
 * authentication, so these headers are what lets the service role, and nothing else on the network, query it.
 */
export const signNeptuneRequest = async (
  url: string,
  body: string,
  region: string,
  credentials: AwsCredentialIdentity,
  signingDate: Date = new Date(),
): Promise<Record<string, string>> => {
  const target = new URL(url);
  const host = target.port ? `${target.hostname}:${target.port}` : target.hostname;

  const signer = new SignatureV4({ service: 'neptune-db', region, credentials, sha256: NodeSha256 });

  const signed = await signer.sign(
    {
      method: 'POST',
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port ? Number(target.port) : undefined,
      path: target.pathname,
      query: {},
      headers: { host, 'content-type': 'application/json', accept: 'application/json' },
      body,
    },
    { signingDate },
  );

  return signed.headers;
};
