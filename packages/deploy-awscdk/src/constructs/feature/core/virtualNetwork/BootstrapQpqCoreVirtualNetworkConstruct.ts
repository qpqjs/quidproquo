import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { AwsVpcFlowLogTrafficType, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { VirtualNetworkQPQConfigSetting } from 'quidproquo-core';

import { aws_ec2, aws_logs } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { getVirtualNetworkWorkloadSecurityGroupName, resolveLogRetention } from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface BootstrapQpqCoreVirtualNetworkConstructProps extends QpqConstructBlockProps {
  virtualNetworkConfig: VirtualNetworkQPQConfigSetting;
}

const flowLogTrafficTypeMap: Record<AwsVpcFlowLogTrafficType, aws_ec2.FlowLogTrafficType> = {
  [AwsVpcFlowLogTrafficType.all]: aws_ec2.FlowLogTrafficType.ALL,
  [AwsVpcFlowLogTrafficType.accept]: aws_ec2.FlowLogTrafficType.ACCEPT,
  [AwsVpcFlowLogTrafficType.reject]: aws_ec2.FlowLogTrafficType.REJECT,
};

export class BootstrapQpqCoreVirtualNetworkConstruct extends QpqConstructBlock {
  public readonly vpc: aws_ec2.Vpc;
  public readonly workloadSecurityGroup: aws_ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: BootstrapQpqCoreVirtualNetworkConstructProps) {
    super(scope, id, props);

    const vpcName = awsNamingUtils.getConfigRuntimeBootstrapResourceNameFromConfig(props.virtualNetworkConfig.name, props.qpqConfig);

    const settings = qpqConfigAwsUtils.getAwsVirtualNetworkSettings(props.qpqConfig, props.virtualNetworkConfig.name);

    this.vpc = new aws_ec2.Vpc(this, 'vpc', {
      maxAzs: settings.maxAzs,
      vpcName: vpcName,

      // undefined = CDK default (one per AZ) — must pass through untouched so
      // already-deployed VPCs see no subnet/NAT churn
      natGateways: settings.natGateways,
    });

    // Every lambda qpq places in this network carries this group, and in-VPC
    // data stores (e.g. Neptune) allow ingress from it only — membership is the
    // trust boundary, not "anything in the VPC". No ingress rules: lambdas
    // receive no inbound. Egress stays open: stories make arbitrary outbound
    // network calls. Later phases look it up by its deterministic name.
    this.workloadSecurityGroup = new aws_ec2.SecurityGroup(this, 'workload-sg', {
      vpc: this.vpc,
      securityGroupName: getVirtualNetworkWorkloadSecurityGroupName(props.virtualNetworkConfig.name, props.qpqConfig),
      description: 'qpq workload lambdas in this virtual network',
      allowAllOutbound: true,
    });

    if (!settings.flowLogs.disable) {
      const flowLogGroup = new aws_logs.LogGroup(this, 'flow-log-group', {
        logGroupName: `/qpq/vpc-flow-logs/${vpcName}`,
        retention: resolveLogRetention(settings.flowLogs.retentionDays),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      this.vpc.addFlowLog('flow-log', {
        destination: aws_ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
        trafficType: flowLogTrafficTypeMap[settings.flowLogs.trafficType],
      });
    }

    if (!settings.disableS3GatewayEndpoint) {
      this.vpc.addGatewayEndpoint('s3-endpoint', {
        service: aws_ec2.GatewayVpcEndpointAwsService.S3,
      });
    }

    if (!settings.disableDynamoDbGatewayEndpoint) {
      this.vpc.addGatewayEndpoint('dynamodb-endpoint', {
        service: aws_ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      });
    }

    for (const serviceName of settings.interfaceEndpoints) {
      // CDK defaults are what we want: one ENI per AZ in the private subnets,
      // an auto-created security group allowing HTTPS from the VPC CIDR, and
      // private DNS on — lambdas resolve the service to the endpoint with no
      // code changes.
      this.vpc.addInterfaceEndpoint(`interface-endpoint-${serviceName}`, {
        service: new aws_ec2.InterfaceVpcEndpointAwsService(serviceName),
      });
    }
  }
}
