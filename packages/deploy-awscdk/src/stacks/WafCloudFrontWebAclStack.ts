import { BootstrapWafQPQConfigSetting, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_iam, aws_ssm, aws_wafv2, Stack } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

import { buildWebAclRules } from '../constructs/feature/config/waf/wafRules';

export interface WafCloudFrontWebAclStackProps {
  qpqConfig: QPQConfig;
  wafConfig: BootstrapWafQPQConfigSetting;

  stackName?: string;
}

// CLOUDFRONT-scope web acls must live in us-east-1 regardless of the deploy region, so this
// is a sibling stack spawned by the bootstrap stack (mirroring DomainCertificateStack). The
// acl arn is handed back to the deploy region via SSM for the web stacks to resolve when
// they set webAclId on their distributions.
export class WafCloudFrontWebAclStack extends Stack {
  constructor(scope: Construct, id: string, props: WafCloudFrontWebAclStackProps) {
    const deployAccountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);
    const deployRegion = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);

    super(scope, id, {
      stackName: props.stackName,
      env: {
        region: 'us-east-1',
        account: deployAccountId,
      },
    });

    const application = qpqCoreUtils.getApplicationName(props.qpqConfig);
    const environment = qpqCoreUtils.getApplicationModuleEnvironment(props.qpqConfig);

    const webAcl = new aws_wafv2.CfnWebACL(this, 'web-acl', {
      name: `qpq-waf-cloudfront-${application}-${environment}`,
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: buildWebAclRules(props.wafConfig),
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `qpq-waf-cloudfront-${application}-${environment}`,
        sampledRequestsEnabled: true,
      },
    });

    const paramName = qpqConfigAwsUtils.getWafWebAclArnSsmParameterName('cloudfront', props.qpqConfig);

    if (deployRegion === 'us-east-1') {
      new aws_ssm.StringParameter(this, 'web-acl-arn-param', {
        parameterName: paramName,
        stringValue: webAcl.attrArn,
      });
    } else {
      // Same cross-region hand-off as DomainCertificateStack: write the arn into the deploy
      // region's SSM so web stacks can valueForStringParameter it. Note the onDelete removes
      // the shared param - same behaviour (and caveat) as the cert-arn param.
      const sdkCall = {
        service: 'SSM',
        action: 'putParameter',
        region: deployRegion,
        parameters: {
          Name: paramName,
          Value: webAcl.attrArn,
          Type: 'String',
          Overwrite: true,
        },
        physicalResourceId: PhysicalResourceId.of(paramName),
      };

      new AwsCustomResource(this, 'web-acl-arn-param-xregion', {
        // Plain SSM put/deleteParameter — Lambda's built-in SDK is plenty; don't
        // npm-install the latest SDK at runtime (slow cold starts, needs internet).
        installLatestAwsSdk: false,
        onCreate: sdkCall,
        onUpdate: sdkCall,
        onDelete: {
          service: 'SSM',
          action: 'deleteParameter',
          region: deployRegion,
          parameters: {
            Name: paramName,
          },
        },
        policy: AwsCustomResourcePolicy.fromStatements([
          new aws_iam.PolicyStatement({
            actions: ['ssm:PutParameter', 'ssm:DeleteParameter'],
            resources: [`arn:aws:ssm:${deployRegion}:${deployAccountId}:parameter${paramName}`],
          }),
        ]),
      });
    }
  }
}
