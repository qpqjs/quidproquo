import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export interface QPQConfigAdvancedAwsOrganizationSettings extends QPQConfigAdvancedSettings {}

export interface AwsOrganizationQPQConfigSetting extends QPQConfigSetting {
  organizationName: string;
  rootAwsOrganizationalUnitId: string;
  accountNames: string[];
  // userAccess: Record<string, string[]>;
  baseEmailAddress: string;
  // identityCenterInstanceId: string;
}

export const defineBootstrapAwsOrganization = (
  rootAwsOrganizationalUnitId: AwsOrganizationQPQConfigSetting['rootAwsOrganizationalUnitId'],
  // identityCenterInstanceId: AwsOrganizationQPQConfigSetting['identityCenterInstanceId'],
  baseEmailAddress: AwsOrganizationQPQConfigSetting['baseEmailAddress'],
  name: AwsOrganizationQPQConfigSetting['organizationName'],
  accountNames: AwsOrganizationQPQConfigSetting['accountNames'],
  // userAccess: AwsOrganizationQPQConfigSetting['userAccess'],
): AwsOrganizationQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.bootstrapAwsOrganization,
  uniqueKey: `${rootAwsOrganizationalUnitId}-${name}`,

  rootAwsOrganizationalUnitId,
  // identityCenterInstanceId,

  organizationName: name,
  accountNames,
  // userAccess,
  baseEmailAddress,
});
