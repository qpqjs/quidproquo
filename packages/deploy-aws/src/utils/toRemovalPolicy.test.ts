import { AwsDataStoreRemovalPolicy } from '@qpqjs/config-aws';

import * as cdk from 'aws-cdk-lib';
import { describe, expect, it } from 'vitest';

import { toRemovalPolicy } from './toRemovalPolicy';

describe('toRemovalPolicy', () => {
  it('destroys only when the config opts into teardown, and retains otherwise', () => {
    expect(toRemovalPolicy(AwsDataStoreRemovalPolicy.destroy)).toBe(cdk.RemovalPolicy.DESTROY);
    expect(toRemovalPolicy(AwsDataStoreRemovalPolicy.retain)).toBe(cdk.RemovalPolicy.RETAIN);
  });

  it("uses the caller's retained policy, so a snapshot-capable store can snapshot instead of orphaning", () => {
    expect(toRemovalPolicy(AwsDataStoreRemovalPolicy.retain, cdk.RemovalPolicy.SNAPSHOT)).toBe(cdk.RemovalPolicy.SNAPSHOT);
    expect(toRemovalPolicy(AwsDataStoreRemovalPolicy.destroy, cdk.RemovalPolicy.SNAPSHOT)).toBe(cdk.RemovalPolicy.DESTROY);
  });
});
