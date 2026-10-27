import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig, qpqCoreUtils, SigningKeyQPQConfigSetting } from 'quidproquo-core';

import { aws_iam, aws_kms } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqResource } from '../../../base/QpqResource';

export interface QpqCoreSigningKeyConstructProps extends QpqConstructBlockProps {
  signingKeyConfig: SigningKeyQPQConfigSetting;
}

// An asymmetric RSA-2048 KMS key for RS256 signing. The private half is generated
// inside KMS and can never be exported, so there is nothing to seed or rotate by
// hand after deploy. Same alias-scoped grant approach as QpqCoreCryptoKeyConstruct
// (see the note there on why Alias.fromAliasName grants are avoided).
export class QpqCoreSigningKeyConstruct extends QpqConstructBlock implements QpqResource {
  key: aws_kms.IKey;

  public grantRead(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.key.grantVerify(grantee);
  }

  public grantWrite(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.key.grantSign(grantee);
  }

  public grantAll(grantee: aws_iam.IGrantable): void {
    this.key.grantSignVerify(grantee);
  }

  constructor(scope: Construct, id: string, props: QpqCoreSigningKeyConstructProps) {
    super(scope, id, props);

    this.key = new aws_kms.Key(this, 'key', {
      alias: `alias/${this.resourceName(props.signingKeyConfig.keyName)}`,
      description: props.signingKeyConfig.keyName,

      keySpec: aws_kms.KeySpec.RSA_2048,
      keyUsage: aws_kms.KeyUsage.SIGN_VERIFY,

      // KMS does not support automatic rotation for asymmetric keys; rotating
      // means a new key under the same alias, which verifiers pick up on their
      // next public-key refresh.
      enableKeyRotation: false,

      // DESTROY schedules deletion with KMS's mandatory waiting period rather
      // than orphaning the key
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(this.key, props.qpqConfig);
  }

  public static authorizeActionsForRole(role: aws_iam.IRole, signingKeyConfigs: SigningKeyQPQConfigSetting[], qpqConfig: QPQConfig): void {
    if (signingKeyConfigs.length === 0) {
      return;
    }

    const toAliasName = (signingKeyConfig: SigningKeyQPQConfigSetting): string =>
      `alias/${awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(signingKeyConfig.keyName, qpqConfig, signingKeyConfig.owner)}`;

    // Only the owning service may sign: that is the whole point of the
    // issuer/verifier split, so a foreign declaration (owner: another module)
    // must not let a verifying service mint tokens. Key ARNs are random ids,
    // so a wildcard is scoped down to our alias names instead (shared-account
    // rule: no account-wide wildcards).
    const ownedAliasNames = [...new Set(qpqCoreUtils.getOwnedItems(signingKeyConfigs, qpqConfig).map(toAliasName))];
    if (ownedAliasNames.length > 0) {
      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          sid: 'QpqSigningKeySign',
          effect: aws_iam.Effect.ALLOW,
          actions: ['kms:Sign'],
          resources: ['*'],
          conditions: {
            'ForAnyValue:StringEquals': {
              'kms:ResourceAliases': ownedAliasNames,
            },
          },
        }),
      );
    }

    // Every declared key, owned or foreign, may be verified against.
    // Verification runs locally against GetPublicKey, so kms:Verify is not
    // needed.
    const allAliasNames = [...new Set(signingKeyConfigs.map(toAliasName))];
    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        sid: 'QpqSigningKeyVerify',
        effect: aws_iam.Effect.ALLOW,
        actions: ['kms:GetPublicKey', 'kms:DescribeKey'],
        resources: ['*'],
        conditions: {
          'ForAnyValue:StringEquals': {
            'kms:ResourceAliases': allAliasNames,
          },
        },
      }),
    );
  }
}
