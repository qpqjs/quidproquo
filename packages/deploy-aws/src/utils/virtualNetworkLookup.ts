import { awsNamingUtils } from '@qpqjs/config-aws';
import { QPQConfig } from '@qpqjs/core';

import { aws_ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { getVirtualNetworkWorkloadSecurityGroupName } from './qpqAwsCdkNamingUtils';

export type VirtualNetworkLookup = {
  vpc: aws_ec2.IVpc;
  // The bootstrap-created workload group, not a CDK auto-created one: in-VPC data stores
  // allow ingress from this group only.
  workloadSecurityGroup: aws_ec2.ISecurityGroup;
};

/** The bootstrap stack's VPC for a defineVirtualNetwork name, with its workload security group; one lookup shape for every consumer. */
export const lookupVirtualNetwork = (scope: Construct, virtualNetworkName: string, qpqConfig: QPQConfig): VirtualNetworkLookup => {
  const vpc = aws_ec2.Vpc.fromLookup(scope, 'vpc-lookup', {
    vpcName: awsNamingUtils.getConfigRuntimeBootstrapResourceNameFromConfig(virtualNetworkName, qpqConfig),
  });

  const workloadSecurityGroup = aws_ec2.SecurityGroup.fromLookupByName(
    scope,
    'workload-sg-lookup',
    getVirtualNetworkWorkloadSecurityGroupName(virtualNetworkName, qpqConfig),
    vpc,
  );

  return { vpc, workloadSecurityGroup };
};
