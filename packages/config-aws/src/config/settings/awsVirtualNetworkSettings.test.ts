import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { AwsVpcFlowLogTrafficType, defineAwsVirtualNetworkSettings } from './awsVirtualNetworkSettings';

describe('defineAwsVirtualNetworkSettings', () => {
  it('applies secure defaults when no options are given', () => {
    expect(defineAwsVirtualNetworkSettings('main')).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsVirtualNetworkSettings,
      uniqueKey: 'main',
      virtualNetworkName: 'main',
      flowLogs: {
        disable: false,
        retentionDays: 365,
        trafficType: AwsVpcFlowLogTrafficType.all,
      },
      disableS3GatewayEndpoint: false,
      disableDynamoDbGatewayEndpoint: false,
      interfaceEndpoints: [],
      natGateways: undefined,
      maxAzs: 2,
    });
  });

  it('carries options through', () => {
    const setting = defineAwsVirtualNetworkSettings('main', {
      flowLogs: { disable: true, retentionDays: 30, trafficType: AwsVpcFlowLogTrafficType.reject },
      disableS3GatewayEndpoint: true,
      disableDynamoDbGatewayEndpoint: true,
      interfaceEndpoints: ['secretsmanager', 'kms'],
      natGateways: 1,
      maxAzs: 3,
    });

    expect(setting).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsVirtualNetworkSettings,
      uniqueKey: 'main',
      virtualNetworkName: 'main',
      flowLogs: {
        disable: true,
        retentionDays: 30,
        trafficType: AwsVpcFlowLogTrafficType.reject,
      },
      disableS3GatewayEndpoint: true,
      disableDynamoDbGatewayEndpoint: true,
      interfaceEndpoints: ['secretsmanager', 'kms'],
      natGateways: 1,
      maxAzs: 3,
    });
  });

  it('merges partial flow log settings over the defaults', () => {
    expect(defineAwsVirtualNetworkSettings('main', { flowLogs: { retentionDays: 90 } }).flowLogs).toEqual({
      disable: false,
      retentionDays: 90,
      trafficType: AwsVpcFlowLogTrafficType.all,
    });
  });

  it('rejects natGateways: 0', () => {
    expect(() => defineAwsVirtualNetworkSettings('main', { natGateways: 0 })).toThrow(/natGateways: 0 is not supported/);
  });
});
