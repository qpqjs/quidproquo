import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig, SigningKeyQPQConfigSetting } from 'quidproquo-core';

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
    if (signingKeyConfigs.length > 0) {
      const aliasNames = signingKeyConfigs.map(
        (signingKeyConfig) =>
          `alias/${awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(signingKeyConfig.keyName, qpqConfig, signingKeyConfig.owner)}`,
      );

      // Verification runs locally against GetPublicKey, so kms:Verify is not
      // needed. Key ARNs are random ids, so scope a wildcard down to our alias
      // names instead (shared-account rule: no account-wide wildcards).
      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          sid: 'QpqSigningKeyUse',
          effect: aws_iam.Effect.ALLOW,
          actions: ['kms:Sign', 'kms:GetPublicKey', 'kms:DescribeKey'],
          resources: ['*'],
          conditions: {
            'ForAnyValue:StringEquals': {
              'kms:ResourceAliases': [...new Set(aliasNames)],
            },
          },
        }),
      );
    }
  }
}
