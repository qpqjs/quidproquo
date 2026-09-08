import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';

import { Construct } from 'constructs';

import {
  BootstrapQpqCoreVirtualNetworkConstruct,
  QpqBootstrapConfigAwsOrganizationConstruct,
  QpqBootstrapConfigGithubDeployRoleConstruct,
  QpqBootstrapConfigWafConstruct,
} from '../constructs';
import { BSQpqLambdaWarmerEventConstructConstruct } from '../constructs/basic/BSQpqLambdaWarmerEventConstruct';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';
import { WafCloudFrontWebAclStack } from './WafCloudFrontWebAclStack';

export interface BootstrapQpqServiceStackProps extends QpqServiceStackProps {}

export class BootstrapQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: BootstrapQpqServiceStackProps) {
    super(scope, id, props);

    new BSQpqLambdaWarmerEventConstructConstruct(this, 'LambdaWarmer', {
      qpqConfig: props.qpqConfig,
    });

    const virtualNetworks = qpqCoreUtils.getVirualNetworkConfigs(props.qpqConfig).map(
      (setting) =>
        new BootstrapQpqCoreVirtualNetworkConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          virtualNetworkConfig: setting,
        }),
    );

    const organiaztions = qpqConfigAwsUtils.getAwsBootstrapOrganizationConfigs(props.qpqConfig).map(
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
