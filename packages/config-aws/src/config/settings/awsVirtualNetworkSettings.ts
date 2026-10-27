import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export enum AwsVpcFlowLogTrafficType {
  all = 'all',
  accept = 'accept',
  reject = 'reject',
}

export interface AwsVirtualNetworkFlowLogSettings {
  // Flow logs are ON unless disabled. CloudWatch Logs ingestion is ~US$0.50/GB —
  // typically cents-to-dollars per month for lambda-only VPCs.
  disable?: boolean;

  // CloudWatch log group retention; rounded UP to the nearest supported
  // RetentionDays value at deploy time. Default 365.
  retentionDays?: number;

  // Which traffic to record. Default all.
  trafficType?: AwsVpcFlowLogTrafficType;
}

export interface QPQConfigAdvancedAwsVirtualNetworkSettings {
  flowLogs?: AwsVirtualNetworkFlowLogSettings;

  // S3/DynamoDB gateway endpoints are free and reduce NAT data-processing
  // charges; only disable if you have custom route-table requirements.
  disableS3GatewayEndpoint?: boolean;
  disableDynamoDbGatewayEndpoint?: boolean;

  // Opt-in interface endpoints by AWS service short name, e.g.
  // ['secretsmanager', 'kms'] — resolved to com.amazonaws.{region}.{name}.
  // Each costs ~US$7.30/mo per AZ (~$14.60/mo at the default maxAzs 2) plus
  // $0.01/GB, in exchange for that service's traffic never leaving the VPC
  // (and not being billed through NAT).
  interfaceEndpoints?: string[];

  // NAT gateways cost ~US$32-45/mo each plus ~$0.045/GB processed. Undefined =
  // CDK default of one per AZ. Set to 1 to halve cost in non-prod (trades AZ
  // redundancy for egress). 0 is rejected: qpq lambdas are placed in
  // PRIVATE_WITH_EGRESS subnets, which don't exist in a NAT-less VPC.
  // Changing this on an already-deployed VPC replaces its subnets.
  natGateways?: number;

  // Default 2. Changing this on an already-deployed VPC replaces its subnets.
  maxAzs?: number;
}

export interface AwsVirtualNetworkQPQConfigSetting extends QPQConfigSetting {
  virtualNetworkName: string;

  flowLogs: Required<AwsVirtualNetworkFlowLogSettings>;

  disableS3GatewayEndpoint: boolean;
  disableDynamoDbGatewayEndpoint: boolean;

  interfaceEndpoints: string[];

  natGateways?: number;
  maxAzs: number;
}

/**
 * Hardens the VPC declared by core `defineVirtualNetwork(name)`. Defaults are
 * secure-by-default: flow logs to CloudWatch (`/qpq/vpc-flow-logs/{vpcName}`)
 * and the free S3/DynamoDB gateway endpoints are enabled even when this
 * setting is never declared — declare it only to opt out or to add interface
 * endpoints / NAT and AZ overrides. Declare alongside `defineVirtualNetwork`
 * in the bootstrap config, keyed by the same name.
 */
export const defineAwsVirtualNetworkSettings = (
  virtualNetworkName: string,
  options?: QPQConfigAdvancedAwsVirtualNetworkSettings,
): AwsVirtualNetworkQPQConfigSetting => {
  if (options?.natGateways === 0) {
    throw new Error(
      `[${virtualNetworkName}] natGateways: 0 is not supported: qpq lambdas are placed in PRIVATE_WITH_EGRESS subnets, ` +
        'and a NAT-less VPC only gets PRIVATE_ISOLATED subnets (failing synth, and replacing existing subnets). ' +
        'Use natGateways: 1 to minimize cost.',
    );
  }

  return {
    configSettingType: QPQAwsConfigSettingType.awsVirtualNetworkSettings,
    uniqueKey: virtualNetworkName,

    virtualNetworkName,

    flowLogs: {
      disable: options?.flowLogs?.disable ?? false,
      retentionDays: options?.flowLogs?.retentionDays ?? 365,
      trafficType: options?.flowLogs?.trafficType ?? AwsVpcFlowLogTrafficType.all,
    },

    disableS3GatewayEndpoint: options?.disableS3GatewayEndpoint ?? false,
    disableDynamoDbGatewayEndpoint: options?.disableDynamoDbGatewayEndpoint ?? false,

    interfaceEndpoints: options?.interfaceEndpoints ?? [],

    natGateways: options?.natGateways,
    maxAzs: options?.maxAzs ?? 2,
  };
};
