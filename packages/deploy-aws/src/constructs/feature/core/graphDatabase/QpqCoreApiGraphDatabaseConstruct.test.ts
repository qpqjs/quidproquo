import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, defineGraphDatabase, GraphDatabaseQPQConfigSetting } from '@qpqjs/core';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreApiGraphDatabaseConstruct } from './QpqCoreApiGraphDatabaseConstruct';

const synth = () => {
  const graphDatabaseConfig: GraphDatabaseQPQConfigSetting = defineGraphDatabase('graph', 'net');
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), graphDatabaseConfig]);
  const stack = new Stack(new App(), 'api', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new QpqCoreApiGraphDatabaseConstruct(stack, 'graph', { qpqConfig, graphDatabaseConfig });

  return Template.fromStack(stack);
};

// Security regression: the cluster requires IAM authentication, so reaching it over the network is not enough; the
// caller must also hold the data-plane actions, which only the service role is granted, on this cluster alone.
describe('QpqCoreApiGraphDatabaseConstruct', () => {
  it('turns on iam database authentication', () => {
    synth().hasResourceProperties('AWS::Neptune::DBCluster', { IamAuthEnabled: true });
  });

  it("grants the service role the query actions on this cluster's own resource id", () => {
    const policies = Object.values(synth().findResources('AWS::IAM::ManagedPolicy'));
    const statements = policies.flatMap((policy: any) => policy.Properties.PolicyDocument.Statement);
    const neptune = statements.find((statement: any) => [statement.Action].flat().includes('neptune-db:ReadDataViaQuery'));

    expect(neptune).toBeDefined();
    expect([neptune.Action].flat().sort()).toEqual(['neptune-db:DeleteDataViaQuery', 'neptune-db:ReadDataViaQuery', 'neptune-db:WriteDataViaQuery']);
    expect(JSON.stringify(neptune.Resource)).toContain(':neptune-db:');
    expect(JSON.stringify(neptune.Resource)).toContain('ClusterResourceId');
    expect(statements.some((statement: any) => [statement.Action].flat().includes('neptune-db:*'))).toBe(false);
  });

  it('still lets only the workload security group reach the cluster', () => {
    synth().hasResourceProperties('AWS::EC2::SecurityGroupIngress', Match.objectLike({ Description: 'qpq workload lambdas' }));
  });
});
