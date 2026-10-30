import { AwsDataStoreRemovalPolicy, awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { CryptoKeyQPQConfigSetting, QPQConfig } from '@qpqjs/core';

import { aws_iam, aws_kms } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsUtils from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqResource } from '../../../base/QpqResource';

export type QpqCoreCryptoKeyConstructProps = {
  cryptoKeyConfig: CryptoKeyQPQConfigSetting;
} & QpqConstructBlockProps;

// No fromOtherStack import path: the one cross-stack reference (a drive or
// store's cryptoKeyName on a foreign key, see resolveCryptoKeyForResource) is
// an Alias.fromAliasName used only as an encryption key id, never for grants.
// Grants from an imported alias silently no-op unless the
// @aws-cdk/aws-kms:applyImportedAliasPermissionsToPrincipal feature flag is
// set, so all access comes from the explicit kms:ResourceAliases policy below.
export class QpqCoreCryptoKeyConstruct extends QpqConstructBlock implements QpqResource {
  key: aws_kms.IKey;

  public override grantRead(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.key.grantDecrypt(grantee);
  }

  public override grantWrite(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.key.grantEncrypt(grantee);
  }

  public override grantAll(grantee: aws_iam.IGrantable): void {
    this.key.grantEncryptDecrypt(grantee);
  }

  constructor(scope: Construct, id: string, props: QpqCoreCryptoKeyConstructProps) {
    super(scope, id, props);

    const dataStoreRemovalPolicy = qpqConfigAwsUtils.getAwsDataStoreRemovalPolicy(props.qpqConfig);

    this.key = new aws_kms.Key(this, 'key', {
      alias: `alias/${this.resourceName(props.cryptoKeyConfig.keyName)}`,
      description: props.cryptoKeyConfig.keyName,

      // Old key material stays available for decrypt after rotation, so this
      // is free for the capability
      enableKeyRotation: true,

      // Follows the data-store removal policy: a retained store is unreadable without the
      // key that encrypts or signs for it. DESTROY still goes through KMS's waiting period.
      removalPolicy: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
    });

    qpqDeployAwsUtils.applyEnvironmentTags(this.key, props.qpqConfig);
  }

  public static authorizeActionsForRole(role: aws_iam.IRole, cryptoKeyConfigs: CryptoKeyQPQConfigSetting[], qpqConfig: QPQConfig): void {
    if (cryptoKeyConfigs.length > 0) {
      const aliasNames = cryptoKeyConfigs.map(
        (cryptoKeyConfig) => `alias/${awsNamingUtils.resolveOwnedResourceName(cryptoKeyConfig.keyName, qpqConfig, cryptoKeyConfig.owner)}`,
      );

      // Key ARNs are random ids, so exact-ARN grants can't be written
      // deterministically (shared-account rule: no account-wide wildcards).
      // Scope the wildcard down to our derived alias names instead.
      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          sid: 'QpqCryptoKeyUse',
          effect: aws_iam.Effect.ALLOW,
          actions: ['kms:GenerateDataKey*', 'kms:Decrypt', 'kms:Encrypt', 'kms:ReEncrypt*', 'kms:DescribeKey'],
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
