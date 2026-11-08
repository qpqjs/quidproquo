import { aws_ec2 } from 'aws-cdk-lib';

/** A defineVirtualNetwork resolved at deploy: the bootstrap stack's VPC and the workload security group inside it. */
export type VirtualNetworkLookup = {
  vpc: aws_ec2.IVpc;
  // The bootstrap-created workload group, not a CDK auto-created one: in-VPC data stores
  // allow ingress from this group only.
  workloadSecurityGroup: aws_ec2.ISecurityGroup;
};
