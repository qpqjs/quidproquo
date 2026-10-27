import { AccountCloudTrailQPQConfigSetting, AwsDataStoreRemovalPolicy, qpqConfigAwsUtils } from 'quidproquo-config-aws';

import * as cdk from 'aws-cdk-lib';
import { aws_cloudtrail, aws_logs, aws_s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { resolveLogRetention } from '../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../base/QpqConstructBlock';

export interface QpqAccountCloudTrailConstructProps extends QpqConstructBlockProps {
  cloudTrailConfig: AccountCloudTrailQPQConfigSetting;
}

export class QpqAccountCloudTrailConstruct extends QpqConstructBlock {
  // Only set when the config enables cloudWatchLogs - consumed by the security services
  // construct for the cognito auth-failure metric filter
  public readonly logGroup?: aws_logs.LogGroup;

  constructor(scope: Construct, id: string, props: QpqAccountCloudTrailConstructProps) {
    super(scope, id, props);

    const {
      name,
      retentionDays = 365,
      enableLogFileValidation = true,
      multiRegion = true,
      includeGlobalServiceEvents = true,
      cloudWatchLogs,
    } = props.cloudTrailConfig;

    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);
    const dataStoreRemovalPolicy = qpqConfigAwsUtils.getAwsDataStoreRemovalPolicy(props.qpqConfig);

    const bucket = new aws_s3.Bucket(this, 'logs', {
      bucketName: `qpq-cloudtrail-${accountId}-${region}-${name}`,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Retain audit logs by default; dev configs opt into full teardown via defineAwsDataStoreRemovalPolicy(destroy).
      removalPolicy: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy,
      lifecycleRules: [{ expiration: cdk.Duration.days(retentionDays) }],
    });

    this.logGroup = cloudWatchLogs
      ? new aws_logs.LogGroup(this, 'log-group', {
          logGroupName: `/qpq/cloudtrail/${name}`,
          retention: resolveLogRetention(cloudWatchLogs.retentionDays),
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
      : undefined;

    new aws_cloudtrail.Trail(this, 'trail', {
      trailName: `${name}-trail`,
      bucket,
      enableFileValidation: enableLogFileValidation,
      isMultiRegionTrail: multiRegion,
      includeGlobalServiceEvents,
      sendToCloudWatchLogs: !!this.logGroup,
      cloudWatchLogGroup: this.logGroup,
    });
  }
}
