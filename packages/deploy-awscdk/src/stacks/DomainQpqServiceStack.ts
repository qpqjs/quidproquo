import { qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { Construct } from 'constructs';

import { ApiGatewayServiceLinkedRole } from '../constructs/basic/ApiGatewayServiceLinkedRole';
import { DomainQpqWebserverApiConstruct } from '../constructs/feature/webserver/api/DomainQpqWebserverApiConstruct';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';
import { createDomainCertificateStacks } from './createDomainCertificateStacks';

export interface DomainQpqServiceStackProps extends QpqServiceStackProps {}

export class DomainQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: DomainQpqServiceStackProps) {
    super(scope, id, props);

    // Materialize one DomainCertificateStack per defineDomainCertificate entry as a sibling
    // stack under the same CDK app. Each cert stack writes its ARN to SSM in the deploy region
    // (cross-region AwsCustomResource for us-east-1 certs). addDependency ensures CloudFormation
    // deploys the cert stacks first so SubdomainName's valueForStringParameter resolves cleanly.
    const certStacks = createDomainCertificateStacks(scope, props.qpqConfig, id);
    certStacks.forEach((certStack) => this.addDependency(certStack));

    // The first api domain in a fresh account needs API Gateway's service-linked role to exist.
    const serviceLinkedRole = new ApiGatewayServiceLinkedRole(this, 'apigateway-service-linked-role', {
      qpqConfig: props.qpqConfig,
    });

    // Regional API Gateway custom DomainName + A record, one per defineApi entry.
    qpqWebServerUtils.getApiConfigs(props.qpqConfig).map((setting) => {
      const api = new DomainQpqWebserverApiConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
        qpqConfig: props.qpqConfig,

        apiConfig: setting,
      });
      api.node.addDependency(serviceLinkedRole);
      return api;
    });
  }
}
