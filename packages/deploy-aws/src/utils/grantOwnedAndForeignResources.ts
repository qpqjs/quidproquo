import { QPQConfig } from '@qpqjs/core';

import { aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { OwnedAndForeignGrant } from './OwnedAndForeignGrant';
import { attachManagedResourcePolicies, getOwnedResourceTagConditions } from './qpqDeployAwsUtils';

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
