import { awsNamingUtils } from '@qpqjs/config-aws';
import { QPQConfig } from '@qpqjs/core';

import { aws_ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { getVirtualNetworkWorkloadSecurityGroupName } from './qpqAwsCdkNamingUtils';
import { VirtualNetworkLookup } from './VirtualNetworkLookup';

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
