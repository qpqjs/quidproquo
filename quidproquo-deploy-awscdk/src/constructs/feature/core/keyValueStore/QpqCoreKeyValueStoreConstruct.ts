import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { AwsDataStoreRemovalPolicy, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { KeyValueStoreQPQConfigSetting, KvsKey, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_dynamodb, aws_iam, aws_kms, aws_ssm } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils/qpqDeployAwsCdkUtils';
import { createDefaultResourceAlarm } from '../../../base/createDefaultResourceAlarm';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqCoreKeyValueStoreConstructProps extends QpqConstructBlockProps {
  keyValueStoreConfig: KeyValueStoreQPQConfigSetting;
}

export abstract class QpqCoreKeyValueStoreConstructBase extends QpqConstructBlock {
  abstract table: aws_dynamodb.ITable;

  public grantRead(grantee: aws_iam.IGrantable) {
    this.table.grantReadData(grantee);
  }

  public grantWrite(grantee: aws_iam.IGrantable) {
    this.table.grantWriteData(grantee);
  }

  public grantAll(grantee: aws_iam.IGrantable) {
    this.table.grantFullAccess(grantee);
  }
}

// Deterministic SSM location for a store's stream ARN, derived from the table's own
// resource name so both stacks compute it without talking to each other.
export const kvsStreamArnSsmParameterName = (tableResourceName: string): string => `/qpq/kvs-stream-arn/${tableResourceName}`;

export const convertKvsKeyTypeToDynamodbAttributeType = (kvsKeyType: KvsKey['type']): aws_dynamodb.AttributeType => {
  switch (kvsKeyType) {
    case 'string':
      return aws_dynamodb.AttributeType.STRING;
    case 'number':
      return aws_dynamodb.AttributeType.NUMBER;
    case 'binary':
      return aws_dynamodb.AttributeType.BINARY;
  }

  throw new Error(`Unknown KvsKeyType: ${kvsKeyType}`);
};

export const convertKvsKeyToDynamodbAttribute = (kvsKey: KvsKey): aws_dynamodb.Attribute => ({
  name: kvsKey.key,
  type: convertKvsKeyTypeToDynamodbAttributeType(kvsKey.type),
});

export class QpqCoreKeyValueStoreConstruct extends QpqCoreKeyValueStoreConstructBase {
  table: aws_dynamodb.ITable;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, keyValueStoreName: string): QpqCoreKeyValueStoreConstructBase {
    const tableNameOverride = qpqConfigAwsUtils.getDynamoTableNameOverrride(keyValueStoreName, qpqConfig);

    class Import extends QpqCoreKeyValueStoreConstructBase {
      table = aws_dynamodb.Table.fromTableName(this, 'table', tableNameOverride || this.qpqResourceName(keyValueStoreName, 'kvs'));
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreKeyValueStoreConstructProps) {
    super(scope, id, props);

    const dataStoreRemovalPolicy = qpqConfigAwsUtils.getAwsDataStoreRemovalPolicy(props.qpqConfig);

    const [primarySortKey] = props.keyValueStoreConfig.sortKeys;

    let tableEncryption: aws_dynamodb.TableEncryption | undefined;
    let encryptionKey: aws_kms.IKey | undefined;
    if (props.keyValueStoreConfig.encryption) {
      const kmsCfg = qpqConfigAwsUtils.getAwsKmsKeyForKeyValueStore(props.qpqConfig, props.keyValueStoreConfig);
      if (kmsCfg) {
        encryptionKey = aws_kms.Key.fromKeyArn(this, 'enc-key', kmsCfg.arn);
        tableEncryption = aws_dynamodb.TableEncryption.CUSTOMER_MANAGED;
      } else {
        tableEncryption = aws_dynamodb.TableEncryption.AWS_MANAGED;
      }
    }

    const table = new aws_dynamodb.Table(this, 'table', {
      tableName: this.qpqResourceName(props.keyValueStoreConfig.keyValueStoreName, 'kvs'),
      partitionKey: convertKvsKeyToDynamodbAttribute(props.keyValueStoreConfig.partitionKey),
      sortKey: primarySortKey && convertKvsKeyToDynamodbAttribute(primarySortKey),
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      // Retain data stores by default; dev configs opt into full teardown via defineAwsDataStoreRemovalPolicy(destroy).
      // When retained, deletionProtection also blocks deletes/replacements outright (RETAIN alone only orphans the table).
      removalPolicy: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      deletionProtection: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.retain,
      timeToLiveAttribute: props.keyValueStoreConfig.ttlAttribute,
      // PITR on by default (35-day continuous backups / point-in-time restore); opt out per-table via config.
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: !props.keyValueStoreConfig.disablePointInTimeRecovery },
      encryption: tableEncryption,
      encryptionKey,
      // Change data capture, only when a handler is configured — a stream on a table
      // nothing consumes is pure cost. NEW_AND_OLD_IMAGES so a handler can see what a
      // change actually did, including on a delete, where the new image does not exist.
      stream: props.keyValueStoreConfig.onStream ? aws_dynamodb.StreamViewType.NEW_AND_OLD_IMAGES : undefined,
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(table, props.qpqConfig);

    // Default alarms (opt-in via defineNotifyError): read/write throttling means
    // the table is rejecting requests (hot partition / capacity), user-visible.
    createDefaultResourceAlarm(this, props.qpqConfig, {
      id: 'default-alarm-read-throttle',
      alarmName: this.resourceName(`${props.keyValueStoreConfig.keyValueStoreName}-read-throttle`),
      metric: table.metric('ReadThrottleEvents', { period: cdk.Duration.minutes(1), statistic: 'Sum' }),
      threshold: 1,
      evaluationPeriods: 1,
    });
    createDefaultResourceAlarm(this, props.qpqConfig, {
      id: 'default-alarm-write-throttle',
      alarmName: this.resourceName(`${props.keyValueStoreConfig.keyValueStoreName}-write-throttle`),
      metric: table.metric('WriteThrottleEvents', { period: cdk.Duration.minutes(1), statistic: 'Sum' }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // Do local secondary indexes
    for (let i = 1; i < props.keyValueStoreConfig.sortKeys.length; i++) {
      let sortKey = props.keyValueStoreConfig.sortKeys[i];

      table.addLocalSecondaryIndex({
        indexName: sortKey.key,
        sortKey: convertKvsKeyToDynamodbAttribute(sortKey),
      });
    }

    // Do global secondary indexes
    for (const index of props.keyValueStoreConfig.indexes) {
      table.addGlobalSecondaryIndex({
        indexName: index.partitionKey.key,
        partitionKey: convertKvsKeyToDynamodbAttribute(index.partitionKey),
        sortKey: index.sortKey && convertKvsKeyToDynamodbAttribute(index.sortKey),
      });
    }

    this.table = table;

    // Publish the stream ARN for the API stack's handler to pick up.
    //
    // A DynamoDB stream ARN ends in a creation timestamp, so unlike every other resource
    // here it CANNOT be recomputed from naming conventions — which is how the API stack
    // reaches every other table (fromOtherStack). Passing the table object across stacks
    // would work but creates a CloudFormation export, the coupling this codebase avoids
    // everywhere else. So it goes through SSM and is resolved at deploy time, the same
    // trick DomainCertificateLookup uses for cert ARNs.
    if (props.keyValueStoreConfig.onStream) {
      new aws_ssm.StringParameter(this, 'stream-arn', {
        parameterName: kvsStreamArnSsmParameterName(this.qpqResourceName(props.keyValueStoreConfig.keyValueStoreName, 'kvs')),
        stringValue: table.tableStreamArn!,
      });
    }

    // If we have an override, lets use it instead
    // we still want to keep the above table created.
    const tableNameOverride = qpqConfigAwsUtils.getDynamoTableNameOverrride(props.keyValueStoreConfig.keyValueStoreName, props.qpqConfig);
    if (tableNameOverride) {
      console.log('tableNameOverride', tableNameOverride);
      this.table = aws_dynamodb.Table.fromTableName(this, 'tablelink', tableNameOverride);
    }
  }

  public static authorizeActionsForRole(scope: Construct, role: aws_iam.IRole, qpqConfig: QPQConfig) {
    const kvsActions = [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:BatchWriteItem',
      'dynamodb:Query',
      'dynamodb:Scan',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
    ];

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(qpqConfig);

    // Owned tables are granted as a single tag-conditioned statement instead of one ARN
    // pair per table: applyEnvironmentTags stamps every owned table, and DynamoDB ABAC
    // evaluates the table's tags for its index sub-resources too. This keeps the policy
    // a fixed size no matter how many KVSs (eventDoc collections especially) the service
    // accumulates. A table brought in via getDynamoTableNameOverrride is imported, not
    // created here, so it only matches if whoever created it applied the same tags.
    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: kvsActions,
        resources: [`arn:aws:dynamodb:${region}:${accountId}:table/*`, `arn:aws:dynamodb:${region}:${accountId}:table/*/index/*`],
        conditions: {
          StringEquals: qpqDeployAwsCdkUtils.getOwnedResourceTagConditions(qpqConfig),
        },
      }),
    );

    // Deterministically-computed ARNs for KVSs declared in this service's
    // config but owned by another service. Uses the same naming path as
    // `getKvsDynamoTableNameFromConfig` so no CDK cross-stack ref is created.
    // Cross-service access stays as exact ARNs on purpose: this short list is
    // the part of the policy a human should be reviewing.
    const allKvsConfigs = qpqCoreUtils.getAllKeyValueStores(qpqConfig);
    const ownedKvsConfigs = qpqCoreUtils.getOwnedKeyValueStores(qpqConfig);
    const foreignKvsConfigs = allKvsConfigs.filter((cfg) => !ownedKvsConfigs.includes(cfg));

    const foreignArns = foreignKvsConfigs.flatMap((cfg) => {
      const tableName = awsNamingUtils.getKvsDynamoTableNameFromConfig(cfg.keyValueStoreName, qpqConfig, 'kvs');
      const tableArn = `arn:aws:dynamodb:*:*:table/${tableName}`;
      return [tableArn, `${tableArn}/index/*`];
    });

    if (foreignArns.length > 0) {
      qpqDeployAwsCdkUtils.attachManagedResourcePolicies(scope, role, 'webserverKeyValueStoreAccess', kvsActions, foreignArns);
    }

    // Grant KMS permissions for any encrypted KVSs (owned or foreign) whose
    // customer-managed key is declared in this service's config.
    const kmsArns = [...ownedKvsConfigs, ...foreignKvsConfigs]
      .filter((cfg) => cfg.encryption)
      .map((cfg) => qpqConfigAwsUtils.getAwsKmsKeyForKeyValueStore(qpqConfig, cfg)?.arn)
      .filter((arn): arn is string => Boolean(arn));

    if (kmsArns.length > 0) {
      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey', 'kms:Encrypt', 'kms:ReEncrypt*'],
          resources: [...new Set(kmsArns)],
        }),
      );
    }
  }
}
