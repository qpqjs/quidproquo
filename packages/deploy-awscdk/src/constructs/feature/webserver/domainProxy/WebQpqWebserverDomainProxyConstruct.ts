import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';
import { DomainProxyQPQWebServerConfigSetting, DomainTarget, qpqWebServerUtils } from 'quidproquo-webserver';
import { DomainProxyViewerProtocolPolicy } from 'quidproquo-webserver';

import { aws_cloudfront, aws_cloudfront_origins, aws_route53, aws_route53_targets, aws_ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils';
import { lookupHostedZone, resolveDeployHosts, resolveHostedZoneForHost } from '../../../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { lookupDomainCertificate } from '../../../basic/DomainCertificateLookup';
import { QpqWebServerCacheConstruct } from '../cache/QpqWebServerCacheConstruct';

export interface WebQpqWebserverDomainProxyConstructProps extends QpqConstructBlockProps {
  domainProxyConfig: DomainProxyQPQWebServerConfigSetting;
}

function convertDomainProxyViewerProtocolPolicyToAwsViewerProtocolPolicy(
  policy: DomainProxyViewerProtocolPolicy,
): aws_cloudfront.ViewerProtocolPolicy {
  switch (policy) {
    case DomainProxyViewerProtocolPolicy.HTTPS_ONLY:
      return aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY;
    case DomainProxyViewerProtocolPolicy.REDIRECT_TO_HTTPS:
      return aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS;
    case DomainProxyViewerProtocolPolicy.ALLOW_ALL:
      return aws_cloudfront.ViewerProtocolPolicy.ALLOW_ALL;
    default:
      throw new Error('Unknown DomainProxyViewerProtocolPolicy value');
  }
}

export class WebQpqWebserverDomainProxyConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: WebQpqWebserverDomainProxyConstructProps) {
    super(scope, id, props);

    // Every subdomain on every root (the site root itself when none are listed), one distribution.
    const service = props.domainProxyConfig.domain.onRootDomain ? undefined : qpqCoreUtils.getApplicationModuleName(props.qpqConfig);
    const subDomainNames = props.domainProxyConfig.domain.subDomainNames ?? [];
    const targets: DomainTarget[] = subDomainNames.length > 0 ? subDomainNames.map((subdomain) => ({ subdomain, service })) : [{ service }];
    const domainNames = targets.flatMap((target) => resolveDeployHosts(props.qpqConfig, target));

    const certificate = lookupDomainCertificate(this, 'us-east-1', props.qpqConfig, props.domainProxyConfig.name);

    const cachePolicy = props.domainProxyConfig.cacheSettingsName
      ? QpqWebServerCacheConstruct.fromOtherStack(
          this,
          'cache',
          props.qpqConfig,
          qpqWebServerUtils.getCacheConfigByName(props.domainProxyConfig.cacheSettingsName, props.qpqConfig),
        ).cachePolicy
      : aws_cloudfront.CachePolicy.CACHING_DISABLED;

    // Create a CloudFront distribution using the S3 bucket as the origin
    // const distributionOrigin = new aws_cloudfront_origins.S3Origin(originBucket);
    let distributionOrigin = new aws_cloudfront_origins.HttpOrigin(props.domainProxyConfig.httpProxyDomain);

    const viewerProtocolPolicy = convertDomainProxyViewerProtocolPolicyToAwsViewerProtocolPolicy(
      props.domainProxyConfig.domainProxyViewerProtocolPolicy,
    );

    const distribution = new aws_cloudfront.Distribution(this, 'MyDistribution', {
      defaultBehavior: {
        origin: distributionOrigin,
        originRequestPolicy: aws_cloudfront.OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,

        cachePolicy: cachePolicy,
        viewerProtocolPolicy,
      },

      domainNames,
      certificate,

      // Shared CLOUDFRONT web acl from the bootstrap phase (us-east-1, arn via SSM like the cert)
      webAclId: qpqConfigAwsUtils.isWafProtectionEnabled(props.qpqConfig)
        ? aws_ssm.StringParameter.valueForStringParameter(this, qpqConfigAwsUtils.getWafWebAclArnSsmParameterName('cloudfront', props.qpqConfig))
        : undefined,
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(distribution, props.qpqConfig);

    qpqDeployAwsCdkUtils.exportStackValue(
      this,
      awsNamingUtils.getCFExportNameDistributionIdArnFromConfig(props.domainProxyConfig.name, props.qpqConfig),
      distribution.distributionId,
    );

    domainNames.forEach((domainName) => {
      new aws_route53.ARecord(this, `${domainName}-web-alias`, {
        zone: lookupHostedZone(this, resolveHostedZoneForHost(props.qpqConfig, domainName)),
        recordName: domainName,
        target: aws_route53.RecordTarget.fromAlias(new aws_route53_targets.CloudFrontTarget(distribution)),
      });
    });

    props.domainProxyConfig.ignoreCache.forEach((pathPattern) => {
      distribution.addBehavior(pathPattern, distributionOrigin, {
        cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy,
      });
    });
  }
}
