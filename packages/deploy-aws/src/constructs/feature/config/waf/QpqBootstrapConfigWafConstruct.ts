import { awsNamingUtils, BootstrapWafQPQConfigSetting, qpqConfigAwsUtils } from '@qpqjs/config-aws';

import { aws_ssm, aws_wafv2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { buildWebAclRules } from './wafRules';

export type QpqBootstrapConfigWafConstructProps = {
  wafConfig: BootstrapWafQPQConfigSetting;
} & QpqConstructBlockProps;

// The REGIONAL web acl protecting api gateway stages. Each service's api stack attaches
// itself via a WebACLAssociation, resolving the arn from the SSM parameter published here
// (bootstrap always deploys before the api phase). The CLOUDFRONT-scope twin lives in
// WafCloudFrontWebAclStack (us-east-1).
export class QpqBootstrapConfigWafConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqBootstrapConfigWafConstructProps) {
    super(scope, id, props);

    const webAclName = awsNamingUtils.getConfigRuntimeBootstrapResourceNameFromConfig('qpq-waf-regional', props.qpqConfig);

    const webAcl = new aws_wafv2.CfnWebACL(this, 'web-acl', {
      name: webAclName,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: buildWebAclRules(props.wafConfig),
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: webAclName,
        sampledRequestsEnabled: true,
      },
    });

    new aws_ssm.StringParameter(this, 'web-acl-arn-param', {
      parameterName: qpqConfigAwsUtils.getWafWebAclArnSsmParameterName('regional', props.qpqConfig),
      stringValue: webAcl.attrArn,
    });
  }
}
