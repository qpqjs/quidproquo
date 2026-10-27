import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { DomainTarget, qpqWebServerUtils } from 'quidproquo-webserver';

import { aws_apigateway, aws_certificatemanager, aws_route53, aws_route53_targets } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { lookupHostedZone, resolveDeployHostForRoot, resolveHostedZoneForHost } from '../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../base/QpqConstructBlock';
import { lookupDomainCertificate } from './DomainCertificateLookup';

export interface SubdomainNameProps extends QpqConstructBlockProps {
  target: DomainTarget;
  rootDomain: string;
}

/** A regional API Gateway custom domain plus its A record, for one target on one root. */
export class SubdomainName extends QpqConstructBlock {
  public readonly domainName: aws_apigateway.DomainName;
  public readonly certificate: aws_certificatemanager.ICertificate;
  public readonly targetARecord: aws_route53.RecordTarget;
  public readonly deployDomain: string;

  constructor(scope: Construct, id: string, props: SubdomainNameProps) {
    super(scope, id, props);

    this.deployDomain = resolveDeployHostForRoot(props.qpqConfig, props.rootDomain, props.target);

    const hostedZone = lookupHostedZone(this, resolveHostedZoneForHost(props.qpqConfig, this.deployDomain));

    const deployRegion = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);
    this.certificate = lookupDomainCertificate(this, deployRegion, props.qpqConfig, id);

    this.domainName = new aws_apigateway.DomainName(this, 'domain-name', {
      domainName: this.deployDomain,
      certificate: this.certificate,
      securityPolicy: aws_apigateway.SecurityPolicy.TLS_1_2,
      endpointType: aws_apigateway.EndpointType.REGIONAL,
    });

    this.targetARecord = aws_route53.RecordTarget.fromAlias(new aws_route53_targets.ApiGatewayDomain(this.domainName));

    new aws_route53.ARecord(this, 'a-record', {
      zone: hostedZone,
      recordName: this.deployDomain,
      target: this.targetARecord,
    });
  }
}
