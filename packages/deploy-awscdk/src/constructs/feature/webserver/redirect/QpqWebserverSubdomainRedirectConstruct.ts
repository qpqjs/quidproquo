import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { DomainTarget, qpqWebServerUtils, SubdomainRedirectQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { aws_apigateway } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { domainScopedId, resolveDeployHostForRoot } from '../../../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';
import { SubdomainName } from '../../../basic/SubdomainName';

export interface QpqWebserverSubdomainRedirectConstructProps extends QpqConstructBlockProps {
  subdomainRedirectConfig: SubdomainRedirectQPQWebServerConfigSetting;
}

// An absolute url redirects as-is. A declared root redirects to that root's site root under
// the resolver (so `www` -> `development.example.com` in dev), keeping the request path. Any
// other bare host is used literally, also keeping the path.
const resolveRedirectTarget = (qpqConfig: QPQConfig, redirectUrl: string): { redirectBaseUrl: string; appendPath: boolean } => {
  if (redirectUrl.startsWith('http')) {
    return { redirectBaseUrl: redirectUrl, appendPath: false };
  }

  const isDeclaredRoot = qpqWebServerUtils.getRootDomains(qpqConfig).includes(redirectUrl);
  const host = isDeclaredRoot ? resolveDeployHostForRoot(qpqConfig, redirectUrl, {}) : redirectUrl;

  return { redirectBaseUrl: `https://${host}`, appendPath: true };
};

export class QpqWebserverSubdomainRedirectConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqWebserverSubdomainRedirectConstructProps) {
    super(scope, id, props);

    const { redirectBaseUrl, appendPath } = resolveRedirectTarget(props.qpqConfig, props.subdomainRedirectConfig.redirectUrl);

    const func = new Function(this, 'redirect', {
      functionName: this.resourceName(`${props.subdomainRedirectConfig.subdomain}-redirect`),
      functionType: 'apiGatewayEventHandler_redirect',
      executorName: 'apiGatewayEventHandler_redirect',

      qpqConfig: props.qpqConfig,

      environment: {
        redirectBaseUrl: JSON.stringify(redirectBaseUrl),
        appendPath: JSON.stringify(appendPath),
      },

      role: this.getServiceRole(),
    });

    const restApi = new aws_apigateway.LambdaRestApi(this, 'rest-api', {
      restApiName: this.resourceName(`${props.subdomainRedirectConfig.subdomain}-redirect`),
      handler: func.lambdaFunction,
      deployOptions: {
        loggingLevel: aws_apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      proxy: true,
    });

    const target: DomainTarget = {
      subdomain: props.subdomainRedirectConfig.subdomain,
      service: props.subdomainRedirectConfig.onRootDomain ? undefined : qpqCoreUtils.getApplicationModuleName(props.qpqConfig),
    };

    for (const rootDomain of qpqWebServerUtils.getRootDomains(props.qpqConfig)) {
      const serviceDomainName = new SubdomainName(this, domainScopedId(props.qpqConfig, 'service-domain-name', rootDomain), {
        rootDomain,
        target,
        qpqConfig: props.qpqConfig,
      });

      new aws_apigateway.BasePathMapping(this, domainScopedId(props.qpqConfig, 'base-path-mapping', rootDomain), {
        domainName: serviceDomainName.domainName,
        restApi: restApi,
      });
    }
  }
}
