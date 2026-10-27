import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_kms } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/** The crypto keys this stack created, by key name, so a drive or store in the same service gets the real key. */
export type OwnedCryptoKeys = Record<string, aws_kms.IKey>;

/**
 * The KMS key behind a drive or store's `cryptoKeyName`. An owned key is the construct
 * built earlier in this stack; a foreign one is referenced by its derived alias, which S3
 * and DynamoDB accept but validate at create time, so the owning service must already be
 * deployed. Throws at synth when the name is not declared in config at all.
 */
export const resolveCryptoKeyForResource = (
  scope: Construct,
  id: string,
  qpqConfig: QPQConfig,
  cryptoKeyName: string,
  ownedCryptoKeys: OwnedCryptoKeys,
): aws_kms.IKey => {
  const cryptoKeyConfig = qpqCoreUtils.getCryptoKeyByName(cryptoKeyName, qpqConfig);

  const owned = ownedCryptoKeys[cryptoKeyName];
  if (owned) {
    return owned;
  }

  const aliasName = `alias/${awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(cryptoKeyConfig.keyName, qpqConfig, cryptoKeyConfig.owner)}`;

  return aws_kms.Alias.fromAliasName(scope, id, aliasName);
};
