import { ApiQPQWebServerConfigSetting, qpqWebServerUtils } from '@qpqjs/webserver';

import { aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { domainScopedId } from '../../../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { SubdomainName } from '../../../basic/SubdomainName';

export type DomainQpqWebserverApiConstructProps = {
  apiConfig: ApiQPQWebServerConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
} & QpqConstructBlockProps;

/** The api's custom domain on every root (SubdomainName reads the deploy-region cert from SSM). */
export class DomainQpqWebserverApiConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: DomainQpqWebserverApiConstructProps) {
    super(scope, id, props);

    for (const rootDomain of qpqWebServerUtils.getRootDomains(props.qpqConfig)) {
      new SubdomainName(this, domainScopedId(props.qpqConfig, 'subdomain', rootDomain), {
        rootDomain,
        target: { subdomain: props.apiConfig.apiSubdomain },
        qpqConfig: props.qpqConfig,
      });
    }
  }
}
