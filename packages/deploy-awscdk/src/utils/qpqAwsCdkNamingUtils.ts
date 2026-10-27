import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig } from 'quidproquo-core';

export const getAccountStackName = awsNamingUtils.getAccountStackName;
export const getBaseStackName = awsNamingUtils.getBaseStackName;
export const getInfStackName = awsNamingUtils.getInfStackName;
export const getWebStackName = awsNamingUtils.getWebStackName;
export const getApiStackName = awsNamingUtils.getApiStackName;
export const getBootstrapStackName = awsNamingUtils.getBootstrapStackName;
export const getDomainStackName = awsNamingUtils.getDomainStackName;

// The shared security group carried by every lambda qpq places in this virtual
// network — in-VPC data stores (e.g. Neptune) allow ingress from this group
// only. Created by the bootstrap stack, looked up by name in later phases
// (deploy-time concern only, so it lives here rather than awsNamingUtils).
export const getVirtualNetworkWorkloadSecurityGroupName = (virtualNetworkName: string, qpqConfig: QPQConfig): string =>
  awsNamingUtils.getConfigRuntimeBootstrapResourceNameFromConfig(`${virtualNetworkName}-workload`, qpqConfig);
