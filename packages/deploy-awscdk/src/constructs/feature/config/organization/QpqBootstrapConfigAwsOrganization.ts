import { AwsOrganizationQPQConfigSetting } from 'quidproquo-config-aws';

import * as cdk from 'aws-cdk-lib';
import { aws_iam, aws_organizations, aws_sso } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqBootstrapConfigAwsOrganizationConstructProps extends QpqConstructBlockProps {
  awsOrganizationConfig: AwsOrganizationQPQConfigSetting;
}

function getEmailForAccount(baseEmailAddress: string, orgName: string, accountName: string): string {
  const [mainEmail, domainEmail] = baseEmailAddress.split('@');
  const [mainEmailNoPlus] = mainEmail.split('@');

  return `${mainEmailNoPlus}+${orgName}-${accountName}@${domainEmail}`;
}

export class QpqBootstrapConfigAwsOrganizationConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqBootstrapConfigAwsOrganizationConstructProps) {
    super(scope, id, props);

    const { organizationName, accountNames, baseEmailAddress } = props.awsOrganizationConfig;

    // Create an Organizational Unit (OU) under the Organization
    const organizationalUnit = new aws_organizations.CfnOrganizationalUnit(this, 'OrganizationalUnit', {
      name: organizationName,
      parentId: props.awsOrganizationConfig.rootAwsOrganizationalUnitId,
    });

    // Create AWS accounts and place them in the Organizational Unit (OU)
    const accounts: { [name: string]: aws_organizations.CfnAccount } = {};
    accountNames.forEach((accountName) => {
      accounts[accountName] = new aws_organizations.CfnAccount(this, accountName, {
        accountName: `${organizationName}-${accountName}`,
        email: getEmailForAccount(baseEmailAddress, organizationName, accountName),
        roleName: `account-${accountName}-AccessRole`,
        parentIds: [organizationalUnit.attrId],
      });
    });

    // // Create the admin permissions
    // const adminPermissionSet = new aws_sso.CfnPermissionSet(this, 'admin-permission-set', {
    //   name: 'AdminAccess',
    //   description: 'Admin access permission set',
    //   instanceArn: `arn:aws:sso:::instance/${props.awsOrganizationConfig.identityCenterInstanceId}`,
    //   managedPolicies: ['arn:aws:iam::aws:policy/AdministratorAccess'],
    //   sessionDuration: 'PT12H',
    // });
  }
}
