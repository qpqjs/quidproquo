import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { qpqCoreUtils } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

import { Construct } from 'constructs';

import {
  BootstrapQpqCoreVirtualNetworkConstruct,
  QpqBootstrapConfigAwsOrganizationConstruct,
  QpqBootstrapConfigGithubDeployRoleConstruct,
  QpqBootstrapConfigWafConstruct,
  QpqBootstrapEmailReceivingDomainConstruct,
} from '../constructs';
import { BSQpqLambdaWarmerEventConstruct } from '../constructs/basic/BSQpqLambdaWarmerEventConstruct';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';
import { WafCloudFrontWebAclStack } from './WafCloudFrontWebAclStack';

export interface BootstrapQpqServiceStackProps extends QpqServiceStackProps {}

export class BootstrapQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: BootstrapQpqServiceStackProps) {
    super(scope, id, props);

    new BSQpqLambdaWarmerEventConstruct(this, 'LambdaWarmer', {
      qpqConfig: props.qpqConfig,
    });

    qpqCoreUtils.getVirtualNetworkConfigs(props.qpqConfig).forEach(
      (setting) =>
        new BootstrapQpqCoreVirtualNetworkConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          virtualNetworkConfig: setting,
        }),
    );

    qpqConfigAwsUtils.getAwsBootstrapOrganizationConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqBootstrapConfigAwsOrganizationConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          awsOrganizationConfig: setting,
        }),
    );

    // Account-level resources (cloud trail, budgets, security services) live in AccountQpqStack

    const githubDeployRoleConfig = qpqConfigAwsUtils.getAwsGithubDeployRoleConfig(props.qpqConfig);
    if (githubDeployRoleConfig) {
      new QpqBootstrapConfigGithubDeployRoleConstruct(this, 'github-deploy-role', {
        qpqConfig: props.qpqConfig,

        githubDeployRoleConfig,
      });
    }

    const emailReceivingDomainConfig = qpqWebServerUtils.getEmailReceivingDomainConfig(props.qpqConfig);
    if (emailReceivingDomainConfig) {
      new QpqBootstrapEmailReceivingDomainConstruct(this, 'email-receiving-domain', {
        qpqConfig: props.qpqConfig,

        emailReceivingDomainConfig,
      });
    }

    const wafConfig = qpqConfigAwsUtils.getBootstrapWafConfig(props.qpqConfig);
    if (wafConfig) {
      // Regional web acl (api gateway) lives in this stack; the CLOUDFRONT-scope twin must
      // live in us-east-1, so it is a sibling stack on the app scope (like the cert stacks)
      // that deploys first via the dependency.
      new QpqBootstrapConfigWafConstruct(this, 'waf', {
        qpqConfig: props.qpqConfig,

        wafConfig,
      });

      const cloudFrontWafStack = new WafCloudFrontWebAclStack(scope, `${id}-waf-cf`, {
        qpqConfig: props.qpqConfig,
        wafConfig,
        stackName: `${this.stackName}-waf-cf`,
      });
      this.addDependency(cloudFrontWafStack);
    }
  }
}
