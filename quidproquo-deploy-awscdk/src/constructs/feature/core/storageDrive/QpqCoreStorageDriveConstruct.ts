import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { AwsDataStoreRemovalPolicy, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils, StorageDriveLifecycleRule, StorageDriveQPQConfigSetting, StorageDriveTransition } from 'quidproquo-core';

import { aws_iam, aws_kms, aws_s3, aws_s3_deployment } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { qpqAwsCdkPathUtils } from '../../../../utils';
import * as qpqDeployAwsCdkUtils from '../../../../utils/qpqDeployAwsCdkUtils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqResource } from '../../../base/QpqResource';
export interface QpqCoreStorageDriveConstructProps extends QpqConstructBlockProps {
  storageDriveConfig: StorageDriveQPQConfigSetting;

  /**
   * Resolved browser origins for the bucket's CORS policy. Computed by the
   * (web-aware) caller so this core construct stays domain-agnostic. Defaults
   * to '*' when omitted (headless/core-only deployments have no browser origin).
   */
  corsAllowedOrigins?: string[];

  /**
   * Whether this drive's bucket is served through a CloudFront distribution
   * (resolved by the web-aware caller from web entry configs). Only then does
   * the bucket policy grant CloudFront read access.
   */
  allowCloudFrontRead?: boolean;
}

export abstract class QpqCoreStorageDriveConstructBase extends QpqConstructBlock implements QpqResource {
  abstract bucket: aws_s3.IBucket;

  public grantRead(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.bucket.grantRead(grantee);
  }

  public grantWrite(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.bucket.grantWrite(grantee);
  }

  public grantAll(grantee: aws_iam.IGrantable): void {
    this.grantRead(grantee);
    this.grantWrite(grantee);
  }
}

const convertStorageDriveTransitionToAwsS3Transition = (storageDriveTransition: StorageDriveTransition): aws_s3.Transition => ({
  storageClass: aws_s3.StorageClass.DEEP_ARCHIVE,
  transitionAfter:
    typeof storageDriveTransition.transitionAfterDays === 'number' ? cdk.Duration.days(storageDriveTransition.transitionAfterDays) : undefined,
  transitionDate: typeof storageDriveTransition.transitionDate === 'string' ? new Date(storageDriveTransition.transitionDate) : undefined,
});

const convertStorageDriveLifecycleRuleToAwsS3LifecycleRule = (lifecycleRule: StorageDriveLifecycleRule): aws_s3.LifecycleRule => ({
  prefix: lifecycleRule.prefix,
  expiration: lifecycleRule.deleteAfterDays ? cdk.Duration.days(lifecycleRule.deleteAfterDays) : undefined,
  objectSizeGreaterThan: lifecycleRule.fileSizeGreaterThan,
  objectSizeLessThan: lifecycleRule.fileSizeLessThan,
  transitions: lifecycleRule.transitions?.map(convertStorageDriveTransitionToAwsS3Transition),
});

export class QpqCoreStorageDriveConstruct extends QpqCoreStorageDriveConstructBase {
  bucket: aws_s3.IBucket;

  static fromOtherStack(
    scope: Construct,
    id: string,
    qpqConfig: QPQConfig,
    storageDriveConfig: StorageDriveQPQConfigSetting,
  ): QpqCoreStorageDriveConstructBase {
    class Import extends QpqCoreStorageDriveConstructBase {
      bucket = aws_s3.Bucket.fromBucketName(scope, `${id}-${storageDriveConfig.uniqueKey}`, this.resourceName(storageDriveConfig.storageDrive));
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreStorageDriveConstructProps) {
    super(scope, id, props);

    const dataStoreRemovalPolicy = qpqConfigAwsUtils.getAwsDataStoreRemovalPolicy(props.qpqConfig);

    // S3_MANAGED is the floor, not an opt-in: S3 applies SSE-S3 to every bucket anyway,
    // and CDK's UNENCRYPTED member is deprecated for exactly that reason.
    let bucketEncryption: aws_s3.BucketEncryption = aws_s3.BucketEncryption.S3_MANAGED;
    let encryptionKey: aws_kms.IKey | undefined;
    if (props.storageDriveConfig.encryption) {
      const kmsCfg = qpqConfigAwsUtils.getAwsKmsKeyForStorageDrive(props.qpqConfig, props.storageDriveConfig);
      if (kmsCfg) {
        encryptionKey = aws_kms.Key.fromKeyArn(this, 'enc-key', kmsCfg.arn);
        bucketEncryption = aws_s3.BucketEncryption.KMS;
      }
    }

    this.bucket = new aws_s3.Bucket(this, 'bucket', {
      bucketName: this.resourceName(props.storageDriveConfig.storageDrive),

      // Disable public access to this bucket, CloudFront will do that
      publicReadAccess: false,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,

      // Retain data stores by default; dev configs opt into full teardown via defineAwsDataStoreRemovalPolicy(destroy)
      removalPolicy: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy,

      // Keep prior object versions so a bad deploy / accidental overwrite can be rolled back
      versioned: true,

      cors: [
        {
          allowedOrigins: props.corsAllowedOrigins ?? ['*'],
          allowedMethods: [aws_s3.HttpMethods.GET, aws_s3.HttpMethods.HEAD, aws_s3.HttpMethods.PUT, aws_s3.HttpMethods.POST],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],

      lifecycleRules: props.storageDriveConfig.lifecycleRules?.map(convertStorageDriveLifecycleRuleToAwsS3LifecycleRule),

      encryption: bucketEncryption,
      encryptionKey,
      bucketKeyEnabled: bucketEncryption === aws_s3.BucketEncryption.KMS,
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(this.bucket, props.qpqConfig);

    const awsAccountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);

    // Account-scoped distribution/* (not the exact distribution ARN) is the ceiling
    // here: the consuming distribution lives in the web phase (its AWS-generated id
    // is unknowable at inf synth), and a bucket resource policy is a single document
    // owned by this stack — the web stack can't append to it later the way it can an
    // IAM role policy.
    if (props.allowCloudFrontRead) {
      this.bucket.addToResourcePolicy(
        new aws_iam.PolicyStatement({
          sid: 'AllowCloudFrontServicePrincipal',
          effect: aws_iam.Effect.ALLOW,
          principals: [new aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
          actions: ['s3:GetObject'],
          resources: [this.bucket.arnForObjects('*')],
          conditions: {
            StringLike: {
              'AWS:SourceArn': `arn:aws:cloudfront::${awsAccountId}:distribution/*`,
            },
          },
        }),
      );
    }

    // if (props.storageDriveConfig.global) {
    //   this.bucket.addToResourcePolicy(
    //     new aws_iam.PolicyStatement({
    //       sid: 'AllowAllEntitiesInAccount',
    //       effect: aws_iam.Effect.ALLOW,
    //       principals: [new aws_iam.AccountPrincipal(props.awsAccountId)],
    //       actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:DeleteObject'],
    //       resources: [this.bucket.arnForObjects('*'), this.bucket.bucketArn],
    //     }),
    //   );
    // }

    if (props.storageDriveConfig.copyPath) {
      const srcDir = qpqAwsCdkPathUtils.getStorageDriveUploadFullPath(props.qpqConfig, props.storageDriveConfig);

      new aws_s3_deployment.BucketDeployment(this, 'bucket-deploy', {
        sources: [aws_s3_deployment.Source.asset(srcDir)],
        destinationBucket: this.bucket,
      });
    }
  }

  public static authorizeActionsForRole(scope: Construct, role: aws_iam.IRole, qpqConfig: QPQConfig) {
    const driveActions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'];

    // Unlike DynamoDB / SSM / Secrets Manager, S3 bucket tags are invisible to IAM
    // authorization (aws:ResourceTag never matches a bucket), so "every drive this
    // service owns" is expressed through the naming convention instead:
    // <resourceName>-<app>-<service>-<env>[-<feature>], resource segment wildcarded.
    // Built by the same helper that names the buckets, so the pattern can't drift.
    //
    // Known edge: a service literally named `<app>-<otherService>` would produce bucket
    // names that also match the other service's suffix pattern. The interior hyphens
    // make an accidental collision effectively impossible for normal names; revisit
    // with a synth-time assertion if service naming ever gets that exotic.
    const ownedBucketPattern = awsNamingUtils.getConfigRuntimeResourceName(
      '*',
      qpqCoreUtils.getApplicationName(qpqConfig),
      qpqCoreUtils.getApplicationModuleName(qpqConfig),
      qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
      qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
    );

    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: driveActions,
        resources: [`arn:aws:s3:::${ownedBucketPattern}`, `arn:aws:s3:::${ownedBucketPattern}/*`],
      }),
    );

    // Deterministically-computed ARNs for drives declared in this service's
    // config but owned by another service. Uses the same naming path as
    // `resolveStorageDriveBucketName` so no CDK cross-stack ref is created.
    // Cross-service access stays as exact ARNs on purpose: this short list is
    // the part of the policy a human should be reviewing.
    const allDriveConfigs = qpqCoreUtils.getStorageDrives(qpqConfig);
    const ownedDriveConfigs = qpqCoreUtils.getOwnedStorageDrives(qpqConfig);
    const foreignDriveConfigs = allDriveConfigs.filter((cfg) => !ownedDriveConfigs.includes(cfg));

    const foreignArns = foreignDriveConfigs.flatMap((cfg) => {
      const bucketName = awsNamingUtils.getConfigRuntimeResourceNameFromConfigWithServiceOverride(
        cfg.owner?.resourceNameOverride || cfg.storageDrive,
        qpqConfig,
        cfg.owner?.module,
      );
      const bucketArn = `arn:aws:s3:::${bucketName}`;
      return [bucketArn, `${bucketArn}/*`];
    });

    if (foreignArns.length > 0) {
      // Off the inline DefaultPolicy (10,240-byte cap) onto managed policies.
      qpqDeployAwsCdkUtils.attachManagedResourcePolicies(scope, role, 'webserverStorageDriveAccess', driveActions, foreignArns);
    }

    // Grant KMS permissions for any encrypted drives (owned or foreign) whose
    // customer-managed key is declared in this service's config.
    const kmsArns = [...ownedDriveConfigs, ...foreignDriveConfigs]
      .filter((cfg) => cfg.encryption)
      .map((cfg) => qpqConfigAwsUtils.getAwsKmsKeyForStorageDrive(qpqConfig, cfg)?.arn)
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
