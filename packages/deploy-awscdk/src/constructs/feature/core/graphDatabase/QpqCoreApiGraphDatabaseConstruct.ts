import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { AwsDataStoreRemovalPolicy, qpqConfigAwsUtils, resolveAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { GraphDatabaseQPQConfigSetting, QPQConfig } from 'quidproquo-core';

import { aws_dynamodb, aws_ec2, aws_iam, aws_logs } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as aws_neptune from '@aws-cdk/aws-neptune-alpha';

import { getVirtualNetworkWorkloadSecurityGroupName } from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqCoreApiGraphDatabaseConstructProps extends QpqConstructBlockProps {
  graphDatabaseConfig: GraphDatabaseQPQConfigSetting;
}

export class QpqCoreApiGraphDatabaseConstruct extends QpqConstructBlock {
  cluster: aws_neptune.IDatabaseCluster;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, keyValueStoreName: string): QpqConstructBlock {
    const tableNameOverride = qpqConfigAwsUtils.getDynamoTableNameOverrride(keyValueStoreName, qpqConfig);

    class Import extends QpqConstructBlock {
      table = aws_dynamodb.Table.fromTableName(this, 'table', tableNameOverride || this.qpqResourceName(keyValueStoreName, 'kvs'));
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreApiGraphDatabaseConstructProps) {
    super(scope, id, props);

    const vpc = aws_ec2.Vpc.fromLookup(this, 'vpc-lookup', {
      vpcName: awsNamingUtils.getConfigRuntimeBootstrapResourceNameFromConfig(props.graphDatabaseConfig.virualNetworkName, props.qpqConfig),
    });

    // const clusterParameterGroup = new aws_neptune.ClusterParameterGroup(this, 'ClusterParams', {
    //   description: 'Cluster parameter group',
    //   parameters: {
    //     neptune_enable_audit_log: '1',
    //   },
    // });

    this.cluster = new aws_neptune.DatabaseCluster(this, 'cluster', {
      dbClusterName: this.resourceName(props.graphDatabaseConfig.name),

      vpc,
      instanceType: aws_neptune.InstanceType.SERVERLESS,

      serverlessScalingConfiguration: {
        minCapacity: 1,
        maxCapacity: 2.5,
      },

      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },

      // Optionally configuring audit logs to be exported to CloudWatch Logs
      cloudwatchLogsExports: [aws_neptune.LogType.AUDIT],
      // Optionally set a retention period on exported CloudWatch Logs
      cloudwatchLogsRetention: aws_logs.RetentionDays.ONE_WEEK,

      // Retain data stores by default; a final snapshot preserves the graph data without keeping
      // an orphaned live cluster running. Dev configs opt into full teardown via defineAwsDataStoreRemovalPolicy(destroy)
      removalPolicy:
        qpqConfigAwsUtils.getAwsDataStoreRemovalPolicy(props.qpqConfig) === AwsDataStoreRemovalPolicy.destroy
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.SNAPSHOT,

      // clusterParameterGroup,
    });

    // Only lambdas carrying the bootstrap-created workload security group can
    // reach the cluster — not everything that lands in the shared VPC
    const workloadSecurityGroup = aws_ec2.SecurityGroup.fromLookupByName(
      this,
      'workload-sg-lookup',
      getVirtualNetworkWorkloadSecurityGroupName(props.graphDatabaseConfig.virualNetworkName, props.qpqConfig),
      vpc,
    );
    this.cluster.connections.allowDefaultPortFrom(workloadSecurityGroup, 'qpq workload lambdas');
  }

  public static authorizeActionsForRole(role: aws_iam.IRole, graphDatabaseConfigs: GraphDatabaseQPQConfigSetting[], qpqConfig: QPQConfig) {
    if (graphDatabaseConfigs.length > 0) {
      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ['rds:DescribeDBClusters'],
          resources: graphDatabaseConfigs.map((gdbc) => {
            const { awsRegion, awsAccountId } = resolveAwsServiceAccountInfo(qpqConfig, gdbc.owner);

            const clusterName = awsNamingUtils.getConfigRuntimeResourceNameFromConfig(gdbc.name, qpqConfig);

            return `arn:aws:rds:${awsRegion}:${awsAccountId}:cluster:${clusterName}`;
          }),
        }),
      );
    }
  }
}
