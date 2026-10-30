import { defineAwsServiceAccountInfo, defineAwsVirtualNetworkSettings } from '@qpqjs/config-aws';
import { defineVirtualNetwork, QPQConfigSetting } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { BootstrapQpqCoreVirtualNetworkConstruct } from './BootstrapQpqCoreVirtualNetworkConstruct';

const synth = (extra: QPQConfigSetting[] = []) => {
  const virtualNetworkConfig = defineVirtualNetwork('net');
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), virtualNetworkConfig, ...extra]);
  const stack = new Stack(new App(), 'bootstrap', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new BootstrapQpqCoreVirtualNetworkConstruct(stack, 'net', { qpqConfig, virtualNetworkConfig });

  return Template.fromStack(stack);
};

// Security regression: the workload group is the trust boundary for in-VPC stores, so it must carry no
// ingress rule at all, and the network keeps flow logs on unless disabled explicitly.
describe('BootstrapQpqCoreVirtualNetworkConstruct', () => {
  it('creates one workload security group with open egress and no ingress', () => {
    const template = synth();
    const groups = Object.values(template.findResources('AWS::EC2::SecurityGroup'));

    expect(groups).toHaveLength(1);
    expect((groups[0] as any).Properties.SecurityGroupIngress).toBeUndefined();
    template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 0);
    expect((groups[0] as any).Properties.SecurityGroupEgress).toEqual([expect.objectContaining({ CidrIp: '0.0.0.0/0', IpProtocol: '-1' })]);
  });

  it('turns on flow logs by default and keeps lambda subnets private behind NAT', () => {
    const template = synth();

    template.resourceCountIs('AWS::EC2::FlowLog', 1);
    template.hasResourceProperties('AWS::EC2::Subnet', { Tags: Match.arrayWith([{ Key: 'aws-cdk:subnet-type', Value: 'Private' }]) });
    expect(Object.keys(template.findResources('AWS::EC2::NatGateway')).length).toBeGreaterThan(0);
  });

  it('refuses a network without NAT, which would strand lambdas with no egress', () => {
    expect(() => defineAwsVirtualNetworkSettings('net', { natGateways: 0 })).toThrow('natGateways: 0 is not supported');
  });
});
