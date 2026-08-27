import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import * as cdk from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';

export const exportStackValue = (scope: Construct, uniqueKey: string, value: string): cdk.CfnOutput => {
  return new cdk.CfnOutput(scope, uniqueKey, {
    exportName: uniqueKey,
    value,
  });
};

export const importStackValue = (uniqueKey: string): string => {
  return cdk.Fn.importValue(uniqueKey);
};

export const applyEnvironmentTags = (scope: IConstruct, qpqConfig: QPQConfig) => {
  cdk.Tags.of(scope).add('environment', qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig));
  cdk.Tags.of(scope).add('application', qpqCoreUtils.getApplicationName(qpqConfig));
  cdk.Tags.of(scope).add('module', qpqCoreUtils.getApplicationModuleName(qpqConfig));

  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);
  if (feature) {
    cdk.Tags.of(scope).add('feature', feature);
  }
};

// applyEnvironmentTags stamps these on every owned resource, so a single
// aws:ResourceTag-conditioned statement can mean "every resource this service deployed"
// without enumerating ARNs (which is what was blowing the inline-policy byte cap).
// application + module + environment (+ feature) together are the ownership boundary:
// this account hosts multiple applications, so a same-named module in another app, or
// the same module in another environment, must not match.
export const getOwnedResourceTagConditions = (qpqConfig: QPQConfig): Record<string, string> => {
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  return {
    'aws:ResourceTag/application': qpqCoreUtils.getApplicationName(qpqConfig),
    'aws:ResourceTag/module': qpqCoreUtils.getApplicationModuleName(qpqConfig),
    'aws:ResourceTag/environment': qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
    ...(feature ? { 'aws:ResourceTag/feature': feature } : {}),
  };
};

// A role's INLINE policies are capped at 10,240 bytes in aggregate, and the
// resource-scoped grants (S3 drives, DynamoDB tables, SSM params, secrets — owned
// + foreign, two exact ARNs apiece) blow that cap as a service accumulates stores
// (every eventDoc collection adds several). Attach those grants as customer-managed
// policies instead: managed policies are a separate budget (6,144 bytes each, many
// attachable per role). Same actions + exact ARNs as before — just packaged off the
// inline DefaultPolicy. The ARN list is chunked so no single managed policy overflows
// its own limit.
//
// ~40 ARNs/policy keeps each document well under 6,144 bytes even for long names; a
// service would need hundreds of referenced resources to approach the (default 10)
// managed-policies-per-role quota.
const MANAGED_POLICY_RESOURCE_CHUNK = 40;

export const attachManagedResourcePolicies = (
  scope: Construct,
  role: cdk.aws_iam.IRole,
  idPrefix: string,
  actions: string[],
  resources: string[],
): void => {
  for (let start = 0; start < resources.length; start += MANAGED_POLICY_RESOURCE_CHUNK) {
    const chunkIndex = start / MANAGED_POLICY_RESOURCE_CHUNK;

    new cdk.aws_iam.ManagedPolicy(scope, `${idPrefix}${chunkIndex}`, {
      roles: [role],
      statements: [
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          actions,
          resources: resources.slice(start, start + MANAGED_POLICY_RESOURCE_CHUNK),
        }),
      ],
    });
  }
};
