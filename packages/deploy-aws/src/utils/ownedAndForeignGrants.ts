import { QPQConfig, QPQConfigSetting, qpqCoreUtils } from '@qpqjs/core';

import { aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { attachManagedResourcePolicies, getOwnedResourceTagConditions } from './qpqDeployAwsUtils';

/** The settings of this config that another service owns (declared here with a cross-module owner). */
export const getForeignConfigs = <T extends QPQConfigSetting>(configs: T[], qpqConfig: QPQConfig): T[] => {
  const owned = qpqCoreUtils.getOwnedItems(configs, qpqConfig);

  return configs.filter((config) => !owned.includes(config));
};

export type OwnedAndForeignGrant = {
  // Prefix for the managed policies the foreign ARNs are attached under.
  idPrefix: string;
  actions: string[];
  // The ARN patterns covering every resource of this kind the service owns.
  ownedResourceArns: string[];
  // Whether the owned statement is narrowed by the service's resource tags. True where IAM
  // can see them (DynamoDB, SSM, Secrets Manager); false for S3, whose bucket tags IAM ignores,
  // where the naming convention in the ARN pattern is the whole boundary.
  ownedByTag: boolean;
  // Exact ARNs of the resources other services own, from the same naming path that names them.
  foreignArns: string[];
};

/**
 * The one shape of a resource-kind grant on the service role. Owned resources are a single
 * pattern statement (tag-conditioned where tags are visible), so the policy stays a fixed size
 * however many the service declares. Cross-service resources stay as exact ARNs on purpose:
 * that short list is the part of the policy a human should review. They go on managed policies,
 * off the inline DefaultPolicy and its 10,240-byte cap.
 */
export const grantOwnedAndForeignResources = (scope: Construct, role: aws_iam.IRole, qpqConfig: QPQConfig, grant: OwnedAndForeignGrant): void => {
  role.addToPrincipalPolicy(
    new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      actions: grant.actions,
      resources: grant.ownedResourceArns,
      ...(grant.ownedByTag ? { conditions: { StringEquals: getOwnedResourceTagConditions(qpqConfig) } } : {}),
    }),
  );

  if (grant.foreignArns.length > 0) {
    attachManagedResourcePolicies(scope, role, grant.idPrefix, grant.actions, grant.foreignArns);
  }
};
